import { WEB_SHORTCUTS, matchesShortcut } from "../../app/keyboard/shortcuts.js";
import { provideWebKeyboard } from "../../app/keyboard/vueKeyboard.js";
import { createApp, createSSRApp, reactive } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import {
  globalActions,
  homeIdentity,
  PROJECT_REPOSITORY_URL,
  repositoryAction,
} from "../../app/pageChrome.js";
import type { GameSession } from "../../runtime/game/createGameSession.js";
import { resolveMapDocument } from "../../services/catalog/exploreMaps.js";
import type { ImportedData } from "../../services/import/importPipeline.js";
import { configureShell } from "../../shell/shellBridge.js";
import { updateWebSettings } from "../../storage/settingsStorage.js";
import HomePage from "./HomePage.vue";
import { createHomeDemoLevel } from "./homeDemoLevel.js";
import type { HomeViewState } from "./types.js";
import { resolveWebText, webT } from "../../i18n/webI18n.js";
import { errorDisplayText } from "../../errors/errorPresentation.js";
import { createHomeViewState } from "./homeViewState.js";

export async function renderHome(
  context: PageContext,
): Promise<PageController> {
  const { app, audio, images, navigate } = context;

  audio.playMusic("title");
  const syncShell = (): void => configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: homeIdentity(),
      actions: [repositoryAction(), ...globalActions()],
    },
    bottomBar: {
      visible: true,
      fixed: false,
      info: [
        { text: "Bobby Carrot 5 Remake" },
        { text: "GitHub", href: PROJECT_REPOSITORY_URL, external: true },
        {
          text: "XUJINKAI",
          href: "https://xujinkai.net/",
          external: true,
        },
      ],
    },
  });
  syncShell();
  const hydrate = app.hasAttribute("data-home-prerendered");
  app.removeAttribute("data-home-prerendered");
  if (!hydrate) app.replaceChildren();
  const view = reactive(createHomeViewState());
  const initialScreenControlEnabled = view.screenControlEnabled;
  let session: GameSession | null = null;
  let resolveCanvas!: (canvas: HTMLCanvasElement) => void;
  const canvasReady = new Promise<HTMLCanvasElement>((resolve) => {
    resolveCanvas = resolve;
  });
  const restartDemo = (): void => {
    session?.game.restart();
  };
  const homeApp = (hydrate ? createSSRApp : createApp)(HomePage, {
    state: view,
    images,
    repositoryUrl: PROJECT_REPOSITORY_URL,
    onReady: (canvas: HTMLCanvasElement) => resolveCanvas(canvas),
    onNavigate: navigate,
    onRestart: restartDemo,
    onScreenControl: () => {
      const enabled = !view.screenControlEnabled;
      updateWebSettings((settings) => ({
        ...settings,
        controls: { ...settings.controls, screenControlEnabled: enabled },
      }));
      window.dispatchEvent(
        new CustomEvent("screen-control-change", { detail: { enabled } }),
      );
    },
    onImportData: (data: ImportedData) =>
      importHomeData(data, view, context),
  });
  provideWebKeyboard(homeApp, context.keyboard);
  homeApp.mount(app);

  const [{ createGameSession }, demo, canvas] = await Promise.all([
    import("../../runtime/game/createGameSession.js"),
    resolveMapDocument({ collection: "original", id: "campaign-intro" }),
    canvasReady,
  ]);
  try {
    session = await createGameSession({
      keyboard: context.keyboard,
      canvas,
      level: createHomeDemoLevel(demo.level),
      gameOptions: {
        audio,
        images,
      },
      runtime: {
        levelMusicOverride: "title",
        outcomeMusic: { won: false },
        hud: { timer: false, steps: false },
        input: {
          keyboardRange: { mode: "focus", root: canvas.closest<HTMLElement>(".game-stage") ?? canvas },
          undo: false,
          zoom: false,
          debug: false,
          screenJoystick: {
            enabled: initialScreenControlEnabled,
          },
        },
      },
    });
  } catch (error) {
    homeApp.unmount();
    throw error;
  }

  const keyboardScope = context.keyboard.runtime.register({
    layer: "page",
    modifiers: "any",
    range: { mode: "focus", root: canvas.closest<HTMLElement>(".game-stage") ?? canvas },
    keydown: (event) => {
      if (!matchesShortcut(event, WEB_SHORTCUTS.restart)) return false;
      restartDemo();
      return true;
    },
  });
  const updateDemo = (): void => {
    if (!session?.game.hasLevel) return;
    const state = session.game.state;
    const win = session.game.winState;
    const remaining =
      win?.type === "carrot" || win?.type === "egg" || win?.type === "push-goal"
        ? win.remaining ?? null
        : null;
    view.demoStatus =
      state.status === "won"
        ? webT("home.demoMove")
        : state.status === "dead"
          ? webT("home.demoDead")
          : `${webT("home.demoMove")}${remaining === null ? "" : ` · ${webT("home.demoRemaining", { count: remaining })}`}`;
    view.demoResult =
      state.status === "won"
        ? "complete"
        : state.status === "dead"
          ? "death"
          : null;
    view.deathReason = state.deathReason ?? webT("home.demoDeathReason");
  };
  session.game.on("change", updateDemo);
  updateDemo();
  let shellDialogLease: ReturnType<GameSession["gates"]["acquire"]> | null = null;
  const onDialogOpen = (): void => {
    shellDialogLease ??= session!.gates.acquire("shell-dialog");
  };
  const onDialogClose = (): void => {
    shellDialogLease?.release();
    shellDialogLease = null;
  };
  const onScreenControlChange = (event: Event): void => {
    const enabled = Boolean(
      (event as CustomEvent<{ enabled: boolean }>).detail.enabled,
    );
    view.screenControlEnabled = enabled;
    session!.input.setScreenJoystickEnabled(enabled);
  };
  window.addEventListener("shell-dialog-open", onDialogOpen);
  window.addEventListener("shell-dialog-close", onDialogClose);
  window.addEventListener("screen-control-change", onScreenControlChange);
  return {
    localeChanged(): void {
      syncShell();
      updateDemo();
    },
    destroy(): void {
      shellDialogLease?.release();
      window.removeEventListener("shell-dialog-open", onDialogOpen);
      window.removeEventListener("shell-dialog-close", onDialogClose);
      window.removeEventListener("screen-control-change", onScreenControlChange);
      keyboardScope.dispose();
      session?.destroy();
      homeApp.unmount();
    },
  };
}

async function importHomeData(
  data: ImportedData,
  view: HomeViewState,
  context: PageContext,
): Promise<void> {
  const { navigate } = context;
  if (data.type !== "map") {
    const { applyImportedSave } = await import(
      "../../services/import/importPipeline.js"
    );
    try {
      const collections = data.type === "explore-save"
        ? (await context.loadCollectionsIndex()).collections
        : [];
      navigate(applyImportedSave(data, collections));
      view.importFeedback = "";
    } catch (error) {
      view.importFeedback = resolveWebText(errorDisplayText(error));
    }
    return;
  }
  sessionStorage.setItem(
    "bc5r:pending-play-level",
    JSON.stringify(data.value),
  );
  view.importFeedback = "";
  navigate("/explore/play/imported/shared-map");
}
