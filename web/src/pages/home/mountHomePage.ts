import { createApp, reactive } from "vue";
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
import { loadAdventureSave } from "../../storage/adventureSaveStorage.js";
import {
  getWebSettings,
  updateWebSettings,
} from "../../storage/settingsStorage.js";
import HomePage from "./HomePage.vue";
import { createHomeDemoLevel } from "./homeDemoLevel.js";
import type { HomeViewState } from "./types.js";

export async function renderHome(
  context: PageContext,
): Promise<PageController> {
  const { app, audio, images, navigate } = context;

  audio.playMusic("title");
  configureShell({
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
  app.replaceChildren();
  const initialScreenControlEnabled =
    getWebSettings().controls.screenControlEnabled;
  const view = reactive<HomeViewState>({
    demoStatus: "WASD / 方向键移动",
    demoResult: null,
    deathReason: "",
    importFeedback: "",
    screenControlEnabled: initialScreenControlEnabled,
  });
  let session: GameSession | null = null;
  let navigatingToAdventure = false;
  let resolveCanvas!: (canvas: HTMLCanvasElement) => void;
  const canvasReady = new Promise<HTMLCanvasElement>((resolve) => {
    resolveCanvas = resolve;
  });
  const homeApp = createApp(HomePage, {
    state: view,
    images,
    onReady: (canvas: HTMLCanvasElement) => resolveCanvas(canvas),
    onNavigate: navigate,
    onRestart: () => {
      session?.game.restart();
    },
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
      importHomeData(data, view, navigate),
  });
  homeApp.mount(app);

  const [{ createGameSession }, demo, canvas] = await Promise.all([
    import("../../runtime/game/createGameSession.js"),
    resolveMapDocument({ collection: "original", id: "campaign-intro" }),
    canvasReady,
  ]);
  try {
    session = await createGameSession({
      canvas,
      level: createHomeDemoLevel(demo.level),
      gameOptions: {
        audio,
        images,
      },
      runtime: {
        levelMusicOverride: "title",
        hud: { timer: false, steps: false },
        input: {
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
        ? "正在进入冒险模式…"
        : state.status === "dead"
          ? "Bobby 遇到了危险，可以重新开始。"
          : `WASD / 方向键移动${remaining === null ? "" : ` · 剩余目标 ${remaining}`}`;
    view.demoResult =
      state.status === "dead" ? "death" : null;
    view.deathReason = state.deathReason ?? "Bobby 没能继续前进。";
    if (state.status === "won" && !navigatingToAdventure) {
      navigatingToAdventure = true;
      queueMicrotask(() => {
        const resumeLevelId = loadAdventureSave().campaign.resumeLevelId;
        navigate(`/adventure/play/${resumeLevelId}`);
      });
    }
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
    destroy(): void {
      shellDialogLease?.release();
      window.removeEventListener("shell-dialog-open", onDialogOpen);
      window.removeEventListener("shell-dialog-close", onDialogClose);
      window.removeEventListener("screen-control-change", onScreenControlChange);
      session?.destroy();
      homeApp.unmount();
    },
  };
}

async function importHomeData(
  data: ImportedData,
  view: HomeViewState,
  navigate: PageContext["navigate"],
): Promise<void> {
  if (data.type !== "map") {
    const { applyImportedSave } = await import(
      "../../services/import/importPipeline.js"
    );
    view.importFeedback = "";
    navigate(applyImportedSave(data));
    return;
  }
  const { serializeEditorLevel } = await import("@bobby/editor");
  sessionStorage.setItem(
    "bc5r:pending-play-level",
    serializeEditorLevel(data.value),
  );
  view.importFeedback = "";
  navigate("/explore/play/imported/shared-map");
}
