import { parseEditorLevel, serializeEditorLevel } from "@bobby/editor";
import { EntityTypeId, type LevelMap } from "@bobby/model";
import { createApp, reactive } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { explorePlayPath } from "../../app/routes.js";
import { globalActions, homeIdentity } from "../../app/pageChrome.js";
import { webT } from "../../i18n/webI18n.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { resolveMapDocument } from "../../services/catalog/exploreMaps.js";
import { lastExploreMapId } from "../../storage/exploreProgressStorage.js";
import {
  configureShell,
  loadScreenControlPreference,
} from "../../shell/shellBridge.js";
import HomePage from "./HomePage.vue";
import type { HomeViewState } from "./types.js";

const HOME_DEMO_DIALOG_ID = "web.home.demo.sandman";

export async function renderHome(
  context: PageContext,
): Promise<PageController> {
  const { app, collections, audio, images, navigate } = context;
  const original = collections.find((collection) => collection.id === "original");
  if (!original || original.maps.length === 0)
    throw new Error("Home 需要 original collection");
  const lastId = lastExploreMapId("original") ?? original.maps[0]!.id;
  const last = original.maps.find((map) => map.id === lastId) ?? original.maps[0]!;

  audio.playMusic("title");
  configureShell({
    topBar: {
      visible: true,
      fixed: true,
      identity: homeIdentity(),
      actions: globalActions(),
    },
    bottomBar: {
      visible: true,
      fixed: false,
      info: [
        { text: "Bobby Carrot 5 Remake" },
        { text: "XUJINKAI" },
        { text: "License" },
        { text: "Third-party Assets" },
      ],
    },
  });
  app.replaceChildren();
  const view = reactive<HomeViewState>({
    demoStatus: "方向键 / WASD 移动。Demo 视野固定，不响应滚轮缩放。",
    demoResult: null,
    deathReason: "",
    importFeedback: "",
  });
  let session: Awaited<ReturnType<typeof createGameSession>> | null = null;
  let resolveCanvas!: (canvas: HTMLCanvasElement) => void;
  const canvasReady = new Promise<HTMLCanvasElement>((resolve) => {
    resolveCanvas = resolve;
  });
  const homeApp = createApp(HomePage, {
    state: view,
    lastLevelId: last.name,
    onReady: (canvas: HTMLCanvasElement) => resolveCanvas(canvas),
    onNavigate: navigate,
    onRestart: () => session?.game.restart(),
    onRandom: () => {
      const chosen = original.maps[
        Math.floor(Math.random() * original.maps.length)
      ];
      if (chosen)
        navigate(
          explorePlayPath({ collection: "original", id: chosen.id }),
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
  session = await createGameSession({
    root: app,
    canvas,
    level: prepareHomeDemoLevel(demo.level),
    gameOptions: {
      audio,
      images,
      profile: { superKey: true },
    },
    runtime: {
      hud: true,
      input: {
        undo: false,
        zoom: false,
        debug: false,
        screenJoystick: { enabled: loadScreenControlPreference() },
      },
    },
    resolveDialogMessage: (messageId) =>
      messageId === HOME_DEMO_DIALOG_ID ? webT("home.demo.sandman") : undefined,
  });
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
          : `方向键 / WASD 移动 · ${state.moves} 步${remaining === null ? "" : ` · 剩余目标 ${remaining}`}`;
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
      session?.destroy();
      homeApp.unmount();
    },
  };
}

function prepareHomeDemoLevel(level: LevelMap): LevelMap {
  const result = structuredClone(level);
  for (const entity of result.entities) {
    if (entity.type !== EntityTypeId.SANDMAN) continue;
    entity.properties = {
      ...(entity.properties ?? {}),
      dialogId: HOME_DEMO_DIALOG_ID,
    };
  }
  return result;
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
