import { parseEditorLevel, serializeEditorLevel } from "@bobby/editor";
import { AudioRuntime } from "@bobby/engine";
import { createApp, reactive, type App as VueApp } from "vue";
import {
  createImageManager,
  siteUrl,
} from "../services/assets/gameAssets.js";
import {
  fetchJson,
  type AdventureIndex,
  type MapCollectionIndex,
  type MapCollectionsIndex,
} from "../services/catalog/catalog.js";
import { resolveMapDocument } from "../services/catalog/exploreMaps.js";
import {
  findAdventureLevel,
  renderAdventureChapter,
  renderAdventureChapters,
  renderAdventureHome,
  renderAdventureNightTrain,
} from "../pages/adventure/mountAdventurePages.js";
import { renderEditorPage } from "../pages/editor/mountEditorPage.js";
import { renderEmbedPage } from "../pages/embed/mountEmbedPage.js";
import { renderLevels } from "../pages/explore/mountExplorePage.js";
import { renderGamePage } from "../pages/game/mountGamePage.js";
import { renderHome } from "../pages/home/mountHomePage.js";
import {
  importedLevelMap,
  renderImportMessage,
} from "../pages/import/mountImportPage.js";
import { decodeImportedPayload } from "../services/import/importPipeline.js";
import { renderSettingsPage } from "../pages/settings/mountSettingsPage.js";
import {
  installShellBridge,
  type ShellConfig,
  type ShellViewState,
  unifiedHelpDescriptor,
} from "../shell/shellBridge.js";
import AppRoot from "./AppRoot.vue";
import {
  NOOP_CONTROLLER,
  type PageContext,
  type PageController,
  type ResolvedMapCollection,
} from "./pageContracts.js";
import {
  parseMapPlayUrl,
  type ExploreMapRef,
} from "./routes.js";

interface AppRootHandle {
  openSettings(): void;
}

export class BobbyApp {
  private readonly mount: HTMLDivElement;
  private readonly audio = new AudioRuntime();
  private readonly images = createImageManager();
  private readonly shell = reactive<ShellViewState>(defaultShellState());
  private collectionsIndex: MapCollectionsIndex = EMPTY_COLLECTIONS_INDEX;
  private collections: ResolvedMapCollection[] = [];
  private adventure: AdventureIndex = EMPTY_ADVENTURE_INDEX;
  private indexesLoaded = false;
  private content!: HTMLDivElement;
  private controller: PageController = NOOP_CONTROLLER;
  private vueApp: VueApp<Element> | null = null;
  private vueRoot: AppRootHandle | null = null;

  constructor(mount: HTMLDivElement) {
    this.mount = mount;
  }

  async start(): Promise<void> {
    installShellBridge({
      apply: (config) => this.applyShell(config),
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
    document.addEventListener("pointerdown", this.resumeAudio, { passive: true });
    document.addEventListener("keydown", this.resumeAudio);
    window.addEventListener("popstate", this.onPopState);
    await Promise.all([contentReady, this.images.preload()]);
    await this.renderRoute();
  }

  destroy(): void {
    this.controller.destroy();
    document.removeEventListener("pointerdown", this.resumeAudio);
    document.removeEventListener("keydown", this.resumeAudio);
    window.removeEventListener("popstate", this.onPopState);
    installShellBridge(null);
    this.vueApp?.unmount();
    this.audio.destroy();
    this.images.destroy();
    this.vueApp = null;
    this.vueRoot = null;
  }

  private applyShell(config: ShellConfig): void {
    this.shell.config = config;
  }

  private readonly resumeAudio = (): void => this.audio.resume();

  private readonly onPopState = (): void => {
    void this.renderRoute();
  };

  private readonly navigate = (path: string): void => {
    const target = new URL(path.replace(/^\/+/, ""), document.baseURI);
    history.pushState(null, "", `${target.pathname}${target.search}${target.hash}`);
    void this.renderRoute();
  };

  private pageContext(): PageContext {
    return {
      app: this.content,
      collectionsIndex: this.collectionsIndex,
      collections: this.collections,
      adventure: this.adventure,
      audio: this.audio,
      images: this.images,
      navigate: this.navigate,
    };
  }

  private async renderRoute(): Promise<void> {
    this.controller.destroy();
    this.controller = NOOP_CONTROLLER;
    const path = localRoutePath();
    if (!isDirectMapRoute(path)) await this.ensureIndexes();
    const context = this.pageContext();

    if (path === "/") {
      this.controller = await renderHome(context);
      return;
    }
    if (path === "/embed") {
      this.controller = renderEmbedPage(context);
      return;
    }
    if (path === "/import/v1") {
      await this.renderImport(context);
      return;
    }
    if (path === "/explore") {
      this.controller = await renderLevels(context, "original");
      return;
    }
    if (path.startsWith("/explore/play/")) {
      await this.renderExplorePlay(path, context);
      return;
    }
    if (path.startsWith("/explore/")) {
      const collection = decodeURIComponent(path.split("/")[2] ?? "").toLowerCase();
      this.controller = await renderLevels(context, collection);
      return;
    }
    if (path === "/settings") {
      this.controller = renderSettingsPage(context);
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
    if (path === "/adventure/beaver-shop") {
      await this.renderAdventureScene("beaver-shop", context, "/adventure");
      return;
    }
    if (path === "/adventure/night-train") {
      this.controller = renderAdventureNightTrain(context);
      return;
    }
    if (path === "/adventure/night-train/dream-machine") {
      await this.renderAdventureScene(
        "dream-machine",
        context,
        "/adventure/night-train",
      );
      return;
    }
    if (path === "/adventure/night-train/cloud-9") {
      await this.renderAdventureScene(
        "cloud-9",
        context,
        "/adventure/night-train",
      );
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
      await this.renderAdventurePlay(path, context);
      return;
    }
    if (path === "/edit") {
      this.controller = await renderEditorPage(context);
      return;
    }
    this.navigate("/");
  }

  private async renderImport(context: PageContext): Promise<void> {
    const payload = location.hash.slice(1);
    try {
      const imported = await decodeImportedPayload(payload);
      if (imported.type === "map") {
        sessionStorage.setItem(
          "bc5r:pending-editor-level",
          serializeEditorLevel(imported.value),
        );
        this.controller = await renderGamePage({
          ...context,
          level: imported.level,
          identity: {
            collection: "imported",
            id: "shared-map",
            title: imported.value.meta.name,
          },
          mode: "explore",
        });
        return;
      }
      this.controller = imported.type === "unknown"
        ? renderImportMessage(context, {
            status: "unknown",
            message: "无法识别这段 Bobby Carrot 5 Remake 数据。",
            rawText: imported.rawText,
          })
        : renderImportMessage(context, {
            status: "save",
            data: imported,
          });
    } catch (error) {
      this.controller = renderImportMessage(context, {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async renderExplorePlay(
    path: string,
    context: PageContext,
  ): Promise<void> {
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
        identity: { ...ref, title: level.meta.name },
        mode: "explore",
      });
      return;
    }
    try {
      const resolved = await resolveMapDocument(ref);
      const collection = context.collections.find(
        (item) => item.id === ref.collection,
      ) ?? {
        id: ref.collection,
        ...(await fetchJson<MapCollectionIndex>(
          siteUrl(`assets/maps/${ref.collection}/index.json`),
        )),
      };
      if (collection.schemaVersion !== 1)
        throw new Error(`${collection.id}: collection schemaVersion 必须为 1`);
      const currentIndex = collection.maps.findIndex(
        (item) => item.id === ref.id,
      );
      const explorePreviousMapId =
        currentIndex > 0 ? collection.maps[currentIndex - 1]?.id : undefined;
      const exploreNextMapId =
        currentIndex >= 0 ? collection.maps[currentIndex + 1]?.id : undefined;
      this.controller = await renderGamePage({
        ...context,
        level: resolved.level,
        mapMeta: resolved.document.meta,
        identity: { ...resolved.ref, title: resolved.document.meta.name },
        ...(explorePreviousMapId ? { explorePreviousMapId } : {}),
        ...(exploreNextMapId ? { exploreNextMapId } : {}),
        mode: "explore",
      });
    } catch {
      this.navigate("/explore");
    }
  }

  private async renderAdventurePlay(
    path: string,
    context: PageContext,
  ): Promise<void> {
    const id = decodeURIComponent(path.split("/").pop() ?? "").toLowerCase();
    const found = findAdventureLevel(this.adventure, id);
    if (!found) {
      this.navigate("/adventure/chapters");
      return;
    }
    const ref = parseMapReference(found.level.map);
    if (!ref) throw new Error(`无效 Adventure map reference：${found.level.map}`);
    const resolved = await resolveMapDocument(ref);
    this.controller = await renderGamePage({
      ...context,
      level: resolved.level,
      mapMeta: resolved.document.meta,
      identity: {
        collection: "adventure",
        id: found.level.id,
        title: found.level.id.toUpperCase(),
      },
      adventureChapter: found.chapter,
      adventureLevel: found.level,
      adventureBackPath: "/adventure",
      mode: "adventure",
    });
  }

  private async renderAdventureScene(
    sceneId: string,
    context: PageContext,
    backPath: string,
  ): Promise<void> {
    const scene = this.adventure.specialScenes.find((item) => item.id === sceneId);
    if (!scene) {
      this.navigate(backPath);
      return;
    }
    const ref = parseMapReference(scene.map);
    if (!ref) throw new Error(`无效 Adventure scene map reference：${scene.map}`);
    const resolved = await resolveMapDocument(ref);
    this.controller = await renderGamePage({
      ...context,
      level: resolved.level,
      mapMeta: resolved.document.meta,
      identity: {
        collection: "adventure",
        id: scene.id,
        title: scene.name,
      },
      adventureScene: scene,
      adventureBackPath: backPath,
      adventureCompletionPath: "/adventure",
      mode: "adventure",
    });
  }

  private async ensureIndexes(): Promise<void> {
    if (this.indexesLoaded) return;
    const collectionsIndex = await fetchJson<MapCollectionsIndex>(
      siteUrl("assets/maps/index.json"),
    );
    if (collectionsIndex.schemaVersion !== 1)
      throw new Error("maps/index.json schemaVersion 必须为 1");
    const [collections, adventure] = await Promise.all([
      Promise.all(
        collectionsIndex.collections.map(async (collection) => ({
          id: collection.id,
          ...(await fetchJson<MapCollectionIndex>(
            siteUrl(`assets/maps/${collection.id}/index.json`),
          )),
        })),
      ),
      fetchJson<AdventureIndex>(siteUrl("assets/adventure/index.json")),
    ]);
    for (const collection of collections)
      if (collection.schemaVersion !== 1)
        throw new Error(`${collection.id}: collection schemaVersion 必须为 1`);
    if (adventure.schemaVersion !== 1)
      throw new Error("adventure/index.json schemaVersion 必须为 1");
    this.collectionsIndex = collectionsIndex;
    this.collections = collections;
    this.adventure = adventure;
    this.indexesLoaded = true;
  }
}

const EMPTY_COLLECTIONS_INDEX: MapCollectionsIndex = {
  schemaVersion: 1,
  collections: [],
};

const EMPTY_ADVENTURE_INDEX: AdventureIndex = {
  schemaVersion: 1,
  name: "Bobby Carrot 5 Remake",
  chapters: [],
  specialScenes: [],
};

function parseMapReference(value: string): ExploreMapRef | null {
  const [collection, id, extra] = value.split("/");
  return collection && id && extra === undefined ? { collection, id } : null;
}

function isDirectMapRoute(path: string): boolean {
  return (
    path === "/embed" ||
    path === "/settings" ||
    path === "/edit" ||
    path.startsWith("/explore/play/")
  );
}

function defaultShellState(): ShellViewState {
  return {
    config: {},
    help: unifiedHelpDescriptor(),
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
