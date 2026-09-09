import { parseEditorLevel, serializeEditorLevel } from "@bobby/editor";
import { createDialogBehavior } from "@bobby/engine";
import { MapEntityTypeId } from "@bobby/model";
import { createApp, reactive } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import {
  globalActions,
  homeIdentity,
  PROJECT_REPOSITORY_URL,
  repositoryAction,
} from "../../app/pageChrome.js";
import { webT } from "../../i18n/webI18n.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { resolveMapDocument } from "../../services/catalog/exploreMaps.js";
import { configureShell } from "../../shell/shellBridge.js";
import {
  getWebSettings,
  updateWebSettings,
} from "../../storage/settingsStorage.js";
import HomePage from "./HomePage.vue";
import type { HomeViewState } from "./types.js";

const HOME_DEMO_DIALOG_REF = "sandman-dialog-1";

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
        {
          text: "XUJINKAI",
          href: "https://github.com/XUJINKAI",
          external: true,
        },
        { text: "GitHub", href: PROJECT_REPOSITORY_URL, external: true },
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
  let session: Awaited<ReturnType<typeof createGameSession>> | null = null;
  let resolveCanvas!: (canvas: HTMLCanvasElement) => void;
  const canvasReady = new Promise<HTMLCanvasElement>((resolve) => {
    resolveCanvas = resolve;
  });
  const homeApp = createApp(HomePage, {
    state: view,
    images,
    onReady: (canvas: HTMLCanvasElement) => resolveCanvas(canvas),
    onNavigate: navigate,
    onRestart: () => session?.game.restart(),
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
    onImportMap: (level: ReturnType<typeof parseEditorLevel>) =>
      importHomeMap(level, view, navigate),
  });
  homeApp.mount(app);

  const [demo, canvas] = await Promise.all([
    resolveMapDocument({ collection: "original", id: "campaign-intro" }),
    canvasReady,
  ]);
  const disposeHomeDialog = createDialogBehavior(
    HOME_DEMO_DIALOG_REF,
    ({ self, commands }) => {
      const storedCount = self.entity.state?.dialogCount;
      const count =
        typeof storedCount === "number" && Number.isFinite(storedCount)
          ? storedCount
          : 0;
      commands.setState(self.entity.id, {
        ...(self.entity.state ?? {}),
        dialogCount: count + 1,
      });
      return webT(
        count === 0 ? "home.demo.sandmanFirst" : "home.demo.sandmanAgain",
      );
    },
  );
  try {
    session = await createGameSession({
      canvas,
      level: demo.level,
      gameOptions: {
        audio,
        images,
        profile: { superKey: true },
      },
      runtime: {
        initializeEntityState: (entity) =>
          entity.type === MapEntityTypeId.SANDMAN
            ? { dialog: { "message-ref": HOME_DEMO_DIALOG_REF } }
            : undefined,
        hud: true,
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
    disposeHomeDialog();
    homeApp.unmount();
    throw error;
  }

  const updateDemo = (): void => {
    if (!session?.game.hasLevel) return;
    const state = session.game.state;
    const win = session.game.winState;
    const remaining =
      win?.type === "collect-all" || win?.type === "fill-all"
        ? win.remaining
        : null;
    view.demoStatus =
      state.status === "won"
        ? "Demo 完成，可以进入冒险模式。"
        : state.status === "dead"
          ? "Bobby 遇到了危险，可以重新开始。"
          : `WASD / 方向键移动 · ${state.moves} 步${remaining === null ? "" : ` · 剩余目标 ${remaining}`}`;
    view.demoResult =
      state.status === "won"
        ? "complete"
        : state.status === "dead"
          ? "death"
          : null;
    view.deathReason = state.deathReason ?? "Bobby 没能继续前进。";
  };
  session.game.on("change", updateDemo);
  updateDemo();
  const onDialogOpen = (): void => session!.input.setEnabled(false);
  const onDialogClose = (): void => session!.input.setEnabled(true);
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
      window.removeEventListener("shell-dialog-open", onDialogOpen);
      window.removeEventListener("shell-dialog-close", onDialogClose);
      window.removeEventListener("screen-control-change", onScreenControlChange);
      disposeHomeDialog();
      session?.destroy();
      homeApp.unmount();
    },
  };
}

function importHomeMap(
  level: ReturnType<typeof parseEditorLevel>,
  view: HomeViewState,
  navigate: PageContext["navigate"],
): void {
  sessionStorage.setItem(
    "bc5r:pending-play-level",
    serializeEditorLevel(level),
  );
  view.importFeedback = "";
  navigate("/explore/play/imported/shared-map");
}
