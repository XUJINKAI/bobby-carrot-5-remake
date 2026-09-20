import { AudioRuntime } from "@bobby/engine";
import { createApp, nextTick, reactive, type App as VueApp } from "vue";
import { createImageManager } from "../services/assets/gameAssets.js";
import { CatalogRuntime } from "../services/catalog/catalogRuntime.js";
import {
  installShellBridge,
  type ShellConfig,
  type ShellViewState,
} from "../shell/shellBridge.js";
import AppRoot from "./AppRoot.vue";
import {
  installButtonFocusPolicy,
  type ButtonFocusPolicy,
} from "./buttonFocusPolicy.js";
import {
  NOOP_CONTROLLER,
  type NavigateOptions,
  type PageContext,
  type PageController,
} from "./pageContracts.js";
import { scheduleIdleTask, type CancelIdleTask } from "./idleTasks.js";
import {
  parseMapPlayUrl,
  type ExploreMapRef,
} from "./routes.js";
import { setWebI18nRouteScopes } from "../i18n/webI18n.js";
import { errorDisplayText } from "../errors/errorPresentation.js";
import {
  localizedPageScopes,
  type LocalizedPageLoader,
  loadAdventurePages,
  loadEditorPage,
  loadEmbedPage,
  loadExplorePage,
  loadGamePage,
  loadHomePage,
  loadImportPage,
  loadSettingsPage,
} from "./pageLoaders.js";

interface AppRootHandle {
  openSettings(): void;
}

export class BobbyApp {
  private readonly mount: HTMLDivElement;
  private readonly audio = new AudioRuntime();
  private readonly images = createImageManager();
  private readonly catalog = new CatalogRuntime();
  private readonly shell = reactive<ShellViewState>(defaultShellState());
  private idleTasks: CancelIdleTask[] = [];
  private content!: HTMLDivElement;
  private controller: PageController = NOOP_CONTROLLER;
  private vueApp: VueApp<Element> | null = null;
  private vueRoot: AppRootHandle | null = null;
  private buttonFocusPolicy: ButtonFocusPolicy | null = null;
  private routeGeneration = 0;
  private routeRenderQueue: Promise<void> = Promise.resolve();

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
    this.buttonFocusPolicy = installButtonFocusPolicy(this.mount);
    document.addEventListener("pointerdown", this.resumeAudio, { passive: true });
    document.addEventListener("keydown", this.resumeAudio);
    window.addEventListener("popstate", this.onPopState);
    window.addEventListener("web-locale-change", this.onLocaleChange);
    await contentReady;
    await this.renderRoute();
  }

  destroy(): void {
    this.controller.destroy();
    this.clearIdleTasks();
    this.buttonFocusPolicy?.destroy();
    document.removeEventListener("pointerdown", this.resumeAudio);
    document.removeEventListener("keydown", this.resumeAudio);
    window.removeEventListener("popstate", this.onPopState);
    window.removeEventListener("web-locale-change", this.onLocaleChange);
    installShellBridge(null);
    this.vueApp?.unmount();
    this.audio.destroy();
    this.images.destroy();
    this.vueApp = null;
    this.vueRoot = null;
    this.buttonFocusPolicy = null;
  }

  private applyShell(config: ShellConfig): void {
    this.shell.config = config;
  }

  private readonly resumeAudio = (): void => this.audio.resume();

  private readonly onPopState = (): void => {
    void this.renderRoute();
  };

  private readonly onLocaleChange = (): void => {
    this.controller.localeChanged?.();
  };

  private readonly navigate = (
    path: string,
    options: NavigateOptions = {},
  ): void => {
    const target = new URL(path.replace(/^\/+/, ""), document.baseURI);
    const url = `${target.pathname}${target.search}${target.hash}`;
    if (options.replace) history.replaceState(options.state ?? null, "", url);
    else history.pushState(options.state ?? null, "", url);
    void this.renderRoute();
  };

  private pageContext(): PageContext {
    return {
      app: this.content,
      collectionsIndex: this.catalog.collectionsIndex,
      loadCollectionsIndex: () => this.catalog.loadCollectionsIndex(),
      collections: this.catalog.collections,
      adventure: this.catalog.adventure,
      audio: this.audio,
      images: this.images,
      navigate: this.navigate,
    };
  }

  private renderRoute(): Promise<void> {
    const generation = ++this.routeGeneration;
    const render = async (): Promise<void> => {
      if (generation !== this.routeGeneration) return;
      try {
        await this.renderCurrentRoute(generation);
      } finally {
        await nextTick();
        this.buttonFocusPolicy?.refresh();
      }
    };
    this.routeRenderQueue = this.routeRenderQueue.then(render, render);
    return this.routeRenderQueue;
  }

  private async renderCurrentRoute(generation: number): Promise<void> {
    this.controller.destroy();
    this.controller = NOOP_CONTROLLER;
    this.clearIdleTasks();
    const path = localRoutePath();

    if (path === "/") {
      const { renderHome } = await loadHomePage();
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadHomePage))) return;
      const context = this.pageContext();
      this.controller = await renderHome(context);
      this.scheduleHomePrefetch();
      return;
    }
    if (path === "/embed") {
      const { renderEmbedPage } = await loadEmbedPage();
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadEmbedPage))) return;
      const context = this.pageContext();
      this.controller = renderEmbedPage(context);
      return;
    }
    if (path === "/import/v1") {
      await loadImportPage();
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadImportPage))) return;
      await this.renderImport(generation);
      return;
    }
    if (path.startsWith("/explore/play/")) {
      await this.renderExplorePlay(path, generation);
      return;
    }
    if (path === "/explore" || path.startsWith("/explore/")) {
      const collection = path === "/explore"
        ? "original"
        : decodeURIComponent(path.split("/")[2] ?? "").toLowerCase();
      const [{ renderLevels }] = await Promise.all([
        loadExplorePage(),
        this.catalog.loadCollectionsIndex(),
        this.catalog.loadCollection(collection),
      ]);
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadExplorePage))) return;
      this.controller = await renderLevels(this.pageContext(), collection);
      return;
    }
    if (path === "/settings") {
      const [{ renderSettingsPage }] = await Promise.all([
        loadSettingsPage(),
        this.catalog.loadCollectionsIndex(),
      ]);
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadSettingsPage))) return;
      const context = this.pageContext();
      this.controller = renderSettingsPage(context);
      return;
    }
    if (path === "/edit" || path === "/edit/test") {
      const { renderEditorPage, renderEditorTestPage } = await loadEditorPage();
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadEditorPage))) return;
      this.controller = path === "/edit/test"
        ? await renderEditorTestPage(this.pageContext())
        : await renderEditorPage(this.pageContext());
      return;
    }
    if (!path.startsWith("/adventure")) {
      this.navigate("/");
      return;
    }
    const [, adventurePages] = await Promise.all([
      this.catalog.loadAdventure(),
      loadAdventurePages(),
    ]);
    if (!this.canCommitRoute(generation)) return;
    if (!(await this.activateI18nRoute(generation, loadAdventurePages))) return;
    const context = this.pageContext();
    if (path === "/adventure") {
      this.controller = adventurePages.renderAdventureHome(context);
      return;
    }
    if (path === "/adventure/chapters") {
      this.controller = adventurePages.renderAdventureChapters(context);
      return;
    }
    if (path === "/adventure/beaver-shop") {
      await this.renderAdventureScene("beaver-shop", context, "/adventure", generation);
      return;
    }
    if (path === "/adventure/night-train") {
      this.controller = adventurePages.renderAdventureNightTrain(context);
      return;
    }
    if (path === "/adventure/night-train/dream-machine") {
      await this.renderAdventureScene(
        "dream-machine",
        context,
        "/adventure/night-train",
        generation,
      );
      return;
    }
    if (path === "/adventure/night-train/cloud-9") {
      await this.renderAdventureScene(
        "cloud-9",
        context,
        "/adventure/night-train",
        generation,
      );
      return;
    }
    if (path === "/adventure/night-train/dreamland-reward") {
      await this.renderAdventureScene(
        "dreamland-reward",
        context,
        "/adventure/night-train",
        generation,
      );
      return;
    }
    if (path.startsWith("/adventure/chapter/")) {
      const chapter = Number(path.split("/").pop());
      if (!Number.isInteger(chapter)) {
        this.navigate("/adventure/chapters");
        return;
      }
      this.controller = adventurePages.renderAdventureChapter(context, chapter);
      return;
    }
    if (path.startsWith("/adventure/play/")) {
      await this.renderAdventurePlay(
        path,
        adventurePages.findAdventureLevel,
        generation,
      );
      return;
    }
    this.navigate("/");
  }

  private async renderImport(generation: number): Promise<void> {
    const payload = location.hash.slice(1);
    try {
      const {
        decodeImportedPayload,
        requireImportedSaveTarget,
      } = await import(
        "../services/import/importPipeline.js"
      );
      const imported = await decodeImportedPayload(payload);
      if (imported.type === "map") {
        const { renderGamePage } = await loadGamePage();
        if (!this.canCommitRoute(generation)) return;
        if (!(await this.activateI18nRoute(generation, loadImportPage, loadGamePage))) return;
        sessionStorage.setItem(
          "bc5r:pending-editor-level",
          JSON.stringify(imported.value),
        );
        this.controller = await renderGamePage({
          ...this.pageContext(),
          level: imported.level,
          mapMeta: imported.value.meta,
          identity: {
            collection: "imported",
            id: "shared-map",
            title: imported.value.meta.name || "Imported Bobby Level",
          },
          mode: "explore",
          source: "import",
        });
        return;
      }
      if (imported.type === "explore-save") {
        const index = await this.catalog.loadCollectionsIndex();
        requireImportedSaveTarget(imported, index.collections);
      }
      const { renderImportMessage } = await loadImportPage();
      if (!this.canCommitRoute(generation)) return;
      const context = this.pageContext();
      this.controller = imported.type === "unknown"
        ? renderImportMessage(context, {
            status: "unknown",
            rawText: imported.rawText,
          })
        : renderImportMessage(context, {
            status: "save",
            data: imported,
          });
    } catch (error) {
      const { renderImportMessage } = await loadImportPage();
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadImportPage))) return;
      this.controller = renderImportMessage(this.pageContext(), {
        status: "error",
        message: errorDisplayText(error),
      });
    }
  }

  private async renderExplorePlay(
    path: string,
    generation: number,
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
      const [model, gamePage] = await Promise.all([
        import("@bobby/model"),
        loadGamePage(),
      ]);
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadGamePage))) return;
      const document = model.parseMapDocument(JSON.parse(pending));
      const level = model.parseLevelMap(document);
      sessionStorage.setItem("bc5r:pending-editor-level", pending);
      this.controller = await gamePage.renderGamePage({
        ...this.pageContext(),
        level,
        mapMeta: document.meta,
        identity: { ...ref, title: document.meta.name || ref.id },
        mode: "explore",
        source: "explore",
      });
      return;
    }
    try {
      const [maps, gamePage, collection] = await Promise.all([
        import("../services/catalog/exploreMaps.js"),
        loadGamePage(),
        this.catalog.loadCollection(ref.collection).catch(() => null),
      ]);
      const resolved = await maps.resolveMapDocument(ref);
      if (!this.canCommitRoute(generation)) return;
      if (!(await this.activateI18nRoute(generation, loadGamePage))) return;
      const currentIndex =
        collection?.maps.findIndex((item) => item.id === ref.id) ?? -1;
      const explorePreviousMapId =
        currentIndex > 0 ? collection?.maps[currentIndex - 1]?.id : undefined;
      const exploreNextMapId =
        currentIndex >= 0 ? collection?.maps[currentIndex + 1]?.id : undefined;
      this.controller = await gamePage.renderGamePage({
        ...this.pageContext(),
        level: resolved.level,
        mapMeta: resolved.document.meta,
        identity: {
          ...resolved.ref,
          title: resolved.document.meta.name || resolved.ref.id,
        },
        verified: collection?.maps[currentIndex]?.verified === true,
        ...(explorePreviousMapId ? { explorePreviousMapId } : {}),
        ...(exploreNextMapId ? { exploreNextMapId } : {}),
        mode: "explore",
        source: "explore",
      });
      this.prefetchMaps([
        ...(explorePreviousMapId
          ? [{ collection: ref.collection, id: explorePreviousMapId }]
          : []),
        ...(exploreNextMapId
          ? [{ collection: ref.collection, id: exploreNextMapId }]
          : []),
      ]);
    } catch {
      this.navigate("/explore");
    }
  }

  private async renderAdventurePlay(
    path: string,
    findAdventureLevel: typeof import(
      "../pages/adventure/mountAdventurePages.js"
    )["findAdventureLevel"],
    generation: number,
  ): Promise<void> {
    const id = decodeURIComponent(path.split("/").pop() ?? "").toLowerCase();
    const adventure = this.catalog.adventure;
    const found = findAdventureLevel(adventure, id);
    if (!found) {
      this.navigate("/adventure/chapters");
      return;
    }
    const ref = parseMapReference(found.level.map);
    if (!ref) throw new Error(`无效 Adventure map reference：${found.level.map}`);
    const [maps, gamePage, collection] = await Promise.all([
      import("../services/catalog/exploreMaps.js"),
      loadGamePage(),
      this.catalog.loadCollection(ref.collection),
    ]);
    const resolved = await maps.resolveMapDocument(ref);
    const verified = collection.maps.some(
      (map) => map.id === ref.id && map.verified === true,
    );
    if (!this.canCommitRoute(generation)) return;
    if (!(await this.activateI18nRoute(generation, loadAdventurePages, loadGamePage))) return;
    this.controller = await gamePage.renderGamePage({
      ...this.pageContext(),
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
      replayMap: resolved.ref,
      verified,
      mode: "adventure",
      source: "adventure",
    });
    this.prefetchMaps(adventureNeighborRefs(adventure, found.level.id));
  }

  private async renderAdventureScene(
    sceneId: string,
    context: PageContext,
    backPath: string,
    generation: number,
  ): Promise<void> {
    const scene = this.catalog.adventure.specialScenes.find(
      (item) => item.id === sceneId,
    );
    if (!scene) {
      this.navigate(backPath);
      return;
    }
    const ref = parseMapReference(scene.map);
    if (!ref) throw new Error(`无效 Adventure scene map reference：${scene.map}`);
    const [maps, gamePage, collection] = await Promise.all([
      import("../services/catalog/exploreMaps.js"),
      loadGamePage(),
      this.catalog.loadCollection(ref.collection),
    ]);
    const resolved = await maps.resolveMapDocument(ref);
    const verified = collection.maps.some(
      (map) => map.id === ref.id && map.verified === true,
    );
    if (!this.canCommitRoute(generation)) return;
    if (!(await this.activateI18nRoute(generation, loadAdventurePages, loadGamePage))) return;
    this.controller = await gamePage.renderGamePage({
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
      replayMap: resolved.ref,
      verified,
      mode: "adventure",
      source: "adventure",
    });
  }

  private canCommitRoute(generation: number): boolean {
    return generation === this.routeGeneration;
  }

  private async activateI18nRoute(
    generation: number,
    ...loaders: LocalizedPageLoader<unknown>[]
  ): Promise<boolean> {
    if (!this.canCommitRoute(generation)) return false;
    await setWebI18nRouteScopes(localizedPageScopes(...loaders));
    return this.canCommitRoute(generation);
  }

  private scheduleHomePrefetch(): void {
    this.scheduleIdle(async () => {
      await Promise.all([
        this.catalog.loadAdventure(),
        this.catalog.loadCollectionsIndex(),
        this.catalog.loadCollection("original"),
      ]);
    });
  }

  private prefetchMaps(refs: readonly ExploreMapRef[]): void {
    if (refs.length === 0) return;
    this.scheduleIdle(async () => {
      const { prefetchMapDocument } = await import(
        "../services/catalog/exploreMaps.js"
      );
      await Promise.all(refs.map((ref) => prefetchMapDocument(ref)));
    });
  }

  private scheduleIdle(task: () => void | Promise<void>): void {
    this.idleTasks.push(scheduleIdleTask(task));
  }

  private clearIdleTasks(): void {
    for (const cancel of this.idleTasks) cancel();
    this.idleTasks = [];
  }
}

function parseMapReference(value: string): ExploreMapRef | null {
  const [collection, id, extra] = value.split("/");
  return collection && id && extra === undefined ? { collection, id } : null;
}


function adventureNeighborRefs(
  adventure: PageContext["adventure"],
  currentId: string,
): ExploreMapRef[] {
  const levels = adventure.chapters.flatMap((chapter) => chapter.levels);
  const index = levels.findIndex((level) => level.id === currentId);
  if (index < 0) return [];
  return [levels[index - 1], levels[index + 1]]
    .flatMap((level) => (level ? [parseMapReference(level.map)] : []))
    .filter((ref): ref is ExploreMapRef => ref !== null);
}

function defaultShellState(): ShellViewState {
  return {
    config: {},
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
