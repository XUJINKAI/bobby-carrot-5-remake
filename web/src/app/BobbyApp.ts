import { createApp, reactive, type App as VueApp } from "vue";
import { TinySynthAudioBackend } from "../services/audio/TinySynthAudio.js";
import {
  fetchJson,
  type CustomMapCatalog,
  type LevelCatalog,
  type MapCollectionsIndex,
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
  defaultHelpDescriptor,
  installShellBridge,
  type HelpDescriptor,
  type ShellConfig,
  type ShellViewState,
} from "../shell/shellBridge.js";
import AppRoot from "./AppRoot.vue";
import { resolveExploreMap } from "../services/catalog/exploreMaps.js";
import { mapAssetUrl, parseMapPlayUrl } from "./routes.js";
import { parseEditorLevel, serializeEditorLevel } from "@bobby/editor";
import {
  decodeImportedData,
  importedLevelMap,
  renderImportMessage,
} from "../pages/import/mountImportPage.js";

interface AppRootHandle {
  openSettings(feedback?: string): void;
}

export class BobbyApp {
  private readonly mount: HTMLDivElement;
  private readonly audio = new TinySynthAudioBackend();
  private readonly shell = reactive<ShellViewState>(defaultShellState());
  private catalog: LevelCatalog = EMPTY_LEVEL_CATALOG;
  private customMapCatalog: CustomMapCatalog = EMPTY_CUSTOM_MAP_CATALOG;
  private catalogsLoaded = false;
  private content!: HTMLDivElement;
  private controller: PageController = NOOP_CONTROLLER;
  private vueApp: VueApp<Element> | null = null;
  private vueRoot: AppRootHandle | null = null;

  constructor(mount: HTMLDivElement) {
    this.mount = mount;
  }

  async start(): Promise<void> {
    installShellBridge({
      apply: (config, help) => this.applyShell(config, help),
    });
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

  private applyShell(config: ShellConfig, help: HelpDescriptor): void {
    this.shell.config = config;
    this.shell.help = help;
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
    // 直达 Play 的地图定位只由 URL 决定，Catalog 只为列表和产品元数据服务。
    if (!path.startsWith("/explore/play/")) await this.ensureCatalogs();
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
    if (path === "/import/v1") {
      const payload = location.hash.slice(1);
      try {
        const imported = await decodeImportedData(payload);
        if (imported.type === "map") {
          sessionStorage.setItem(
            "bc5r:pending-editor-level",
            serializeEditorLevel(imported.value),
          );
          this.controller = await renderGamePage({
            ...context,
            level: importedLevelMap(imported.value),
            identity: {
              collection: "imported",
              id: "shared-map",
              title: imported.value.name,
            },
            mode: "explore",
          });
          return;
        }
        this.controller = imported.type === "adventure-profile"
          ? renderImportMessage(context, { status: "profile", profile: imported.value })
          : renderImportMessage(context, {
              status: "unknown",
              message: "无法识别这段 BC5R 数据。",
              rawText: imported.rawText,
            });
      } catch (error) {
        this.controller = renderImportMessage(context, {
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return;
    }
    if (path === "/explore" || path === "/explore/original") {
      this.controller = await renderLevels(context, "original");
      return;
    }
    if (path.startsWith("/explore/play/")) {
      const ref = parseMapPlayUrl(path);
      if (!ref) {
        this.navigate("/explore");
        return;
      }
      ref.collection = ref.collection.toLowerCase();
      ref.id = ref.id.toLowerCase();
      if (ref.collection === "imported") {
        const pending = sessionStorage.getItem("bc5r:pending-play-level");
        if (!pending) {
          this.navigate("/");
          return;
        }
        const level = parseEditorLevel(pending);
        sessionStorage.setItem("bc5r:pending-editor-level", pending);
        this.controller = await renderGamePage({
          ...context,
          level: importedLevelMap(level),
          identity: { ...ref, title: level.name },
          mode: "explore",
        });
        return;
      }
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
        siteUrl(mapAssetUrl("original", level.publicId)),
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

  private async ensureCatalogs(): Promise<void> {
    if (this.catalogsLoaded) return;
    const [catalog, collectionsIndex] = await Promise.all([
      fetchJson<LevelCatalog>(siteUrl("assets/maps/original/index.json")),
      fetchJson<MapCollectionsIndex>(siteUrl("assets/maps/index.json")),
    ]);
    const customCollections = await Promise.all(
      collectionsIndex.collections
        .filter((collection) => collection.id !== "original")
        .map((collection) =>
          fetchJson<CustomMapCatalog["collections"][number]>(
            siteUrl(`assets/maps/${collection.id}/index.json`),
          ),
        ),
    );
    this.catalog = catalog;
    this.customMapCatalog = {
      schemaVersion: 1,
      collections: customCollections,
    };
    this.catalogsLoaded = true;
  }
}

const EMPTY_LEVEL_CATALOG = {
  levels: [],
  chapters: [],
  specialScenes: [],
} as unknown as LevelCatalog;

const EMPTY_CUSTOM_MAP_CATALOG: CustomMapCatalog = {
  schemaVersion: 1,
  collections: [],
};

function defaultShellState(): ShellViewState {
  return {
    config: {},
    help: defaultHelpDescriptor(),
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
