import { createApp, reactive, type App as VueApp } from "vue";
import { TinySynthAudioBackend } from "../services/audio/TinySynthAudio.js";
import {
  fetchJson,
  type CustomMapCatalog,
  type LevelCatalog,
  type OfficialLevelData,
} from "../services/catalog/catalog.js";
import { siteUrl } from "../services/assets/gameAssets.js";
import { NOOP_CONTROLLER, type PageController } from "./pageContracts.js";
import {
  findAdventureLevel,
  renderAdventureChapter,
  renderAdventureChapters,
  renderAdventureHome,
} from "../pages/adventure/mountAdventurePages.js";
import { renderEditorPage } from "../pages/editor/mountEditorPage.js";
import { renderGamePage } from "../pages/game/mountGamePage.js";
import { renderHome } from "../pages/home/mountHomePage.js";
import { renderLevels } from "../pages/explore/mountExplorePage.js";
import {
  installShellBridge,
  type ShellOptions,
  type ShellViewState,
} from "../shell/shellBridge.js";
import AppRoot from "./AppRoot.vue";
import { resolveExploreMap } from "../services/catalog/exploreMaps.js";

interface AppRootHandle {
  openSettings(feedback?: string): void;
}

export class BobbyApp {
  private readonly mount: HTMLDivElement;
  private readonly audio = new TinySynthAudioBackend();
  private readonly shell = reactive<ShellViewState>(defaultShellState());
  private catalog!: LevelCatalog;
  private customMapCatalog!: CustomMapCatalog;
  private content!: HTMLDivElement;
  private controller: PageController = NOOP_CONTROLLER;
  private vueApp: VueApp<Element> | null = null;
  private vueRoot: AppRootHandle | null = null;

  constructor(mount: HTMLDivElement) {
    this.mount = mount;
  }

  async start(): Promise<void> {
    this.catalog = await fetchJson<LevelCatalog>(
      siteUrl("assets/catalog.json"),
    );
    this.customMapCatalog = await fetchJson<CustomMapCatalog>(
      siteUrl("assets/custom-maps.json"),
    );
    installShellBridge({ apply: (options) => this.applyShell(options) });
    const contentReady = new Promise<void>((resolve) => {
      this.vueApp = createApp(AppRoot, {
        shell: this.shell,
        audio: this.audio,
        navigate: this.navigate,
        onContentReady: (element: HTMLDivElement) => {
          this.content = element;
          resolve();
        },
      });
      this.vueRoot = this.vueApp.mount(this.mount) as unknown as AppRootHandle;
    });
    document.addEventListener("pointerdown", this.resumeAudio, {
      passive: true,
    });
    document.addEventListener("keydown", this.resumeAudio);
    window.addEventListener("popstate", this.onPopState);
    await contentReady;
    await this.renderRoute();
  }

  destroy(): void {
    this.controller.destroy();
    document.removeEventListener("pointerdown", this.resumeAudio);
    document.removeEventListener("keydown", this.resumeAudio);
    window.removeEventListener("popstate", this.onPopState);
    installShellBridge(null);
    this.vueApp?.unmount();
    this.vueApp = null;
    this.vueRoot = null;
  }

  private applyShell(options: ShellOptions): void {
    this.shell.mode = options.mode ?? "home";
    this.shell.contextActions = options.contextActions ?? [];
    this.shell.contextInfo = options.contextInfo ?? "准备就绪";
    this.shell.showBottomBar = options.showBottomBar !== false;
    this.shell.showScreenControlToggle =
      options.showScreenControlToggle !== false;
    this.shell.topBarFixed = options.topBarFixed ?? true;
    this.shell.bottomBarFixed = options.bottomBarFixed ?? true;
  }

  private readonly resumeAudio = (): void => this.audio.resume();

  private readonly onPopState = (): void => {
    void this.renderRoute();
  };

  private readonly navigate = (path: string): void => {
    const target = new URL(path.replace(/^\/+/, ""), document.baseURI);
    history.pushState(
      null,
      "",
      `${target.pathname}${target.search}${target.hash}`,
    );
    void this.renderRoute();
  };

  private async renderRoute(): Promise<void> {
    this.controller.destroy();
    this.controller = NOOP_CONTROLLER;
    const path = localRoutePath();
    const context = {
      app: this.content,
      catalog: this.catalog,
      customMapCatalog: this.customMapCatalog,
      audio: this.audio,
      navigate: this.navigate,
    };
    if (path === "/") {
      this.controller = await renderHome(context);
      return;
    }
    if (path === "/explore" || path === "/explore/original") {
      this.controller = await renderLevels(context, "original");
      return;
    }
    if (path.startsWith("/explore/play/")) {
      const parts = path.split("/").filter(Boolean);
      const ref = {
        collection: decodeURIComponent(parts[2] ?? "").toLowerCase(),
        id: decodeURIComponent(parts[3] ?? "").toLowerCase(),
      };
      const resolved = await resolveExploreMap(
        this.catalog,
        this.customMapCatalog,
        ref,
      );
      if (!resolved) {
        this.navigate("/explore");
        return;
      }
      this.controller = await renderGamePage({
        ...context,
        level: resolved.level,
        identity: { ...resolved.ref, title: resolved.title },
        official: resolved.official,
        mode: "explore",
      });
      return;
    }
    if (path.startsWith("/explore/")) {
      const collection = decodeURIComponent(path.split("/")[2] ?? "").toLowerCase();
      this.controller = await renderLevels(context, collection);
      return;
    }
    if (path === "/settings") {
      this.controller = await renderHome(context);
      this.vueRoot?.openSettings();
      return;
    }
    if (path === "/adventure") {
      this.controller = renderAdventureHome(context);
      return;
    }
    if (path === "/adventure/chapters") {
      this.controller = renderAdventureChapters(context);
      return;
    }
    if (path.startsWith("/adventure/chapter/")) {
      const chapter = Number(path.split("/").pop());
      if (!Number.isInteger(chapter)) {
        this.navigate("/adventure/chapters");
        return;
      }
      this.controller = renderAdventureChapter(context, chapter);
      return;
    }
    if (path.startsWith("/adventure/play/")) {
      const id = decodeURIComponent(path.split("/").pop() ?? "").toLowerCase();
      const level = findAdventureLevel(this.catalog, id);
      if (!level) {
        this.navigate("/adventure/chapters");
        return;
      }
      const official = await fetchJson<OfficialLevelData>(
        siteUrl(`assets/${level.path}`),
      );
      this.controller = await renderGamePage({
        ...context,
        level: official,
        identity: {
          collection: "adventure",
          id: level.publicId,
          title: level.publicId.toUpperCase(),
        },
        official: level,
        mode: "adventure",
      });
      return;
    }
    if (path === "/edit") {
      this.controller = await renderEditorPage(context);
      return;
    }
    if (path.startsWith("/edit/")) {
      const parts = path.split("/").filter(Boolean);
      this.controller =
        parts.length === 3
          ? await renderEditorPage({
              ...context,
              mapRef: {
                collection: decodeURIComponent(parts[1] ?? "").toLowerCase(),
                id: decodeURIComponent(parts[2] ?? "").toLowerCase(),
              },
            })
          : await renderEditorPage(context);
      return;
    }
    this.navigate("/");
  }
}

function defaultShellState(): ShellViewState {
  return {
    mode: "home",
    contextActions: [],
    contextInfo: "准备就绪",
    showBottomBar: false,
    showScreenControlToggle: false,
    topBarFixed: true,
    bottomBarFixed: true,
  };
}

function localRoutePath(): string {
  const basePath = new URL(document.baseURI).pathname.replace(/\/+$/, "");
  const localPath =
    basePath && basePath !== "/" && location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : location.pathname;
  return localPath.replace(/\/+$/, "") || "/";
}
