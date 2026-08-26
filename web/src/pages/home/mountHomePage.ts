import { parseEditorLevel, serializeEditorLevel } from "@bobby/editor";
import { createApp, reactive } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { gameAssets, siteUrl } from "../../services/assets/gameAssets.js";
import { resolveMapDocument } from "../../services/catalog/exploreMaps.js";
import { lastExploreMapId } from "../../storage/exploreProgressStorage.js";
import {
  configureShell,
  loadScreenControlPreference,
} from "../../shell/shellBridge.js";
import HomePage from "./HomePage.vue";
import type { HomeViewState } from "./types.js";
import { explorePlayPath } from "../../app/routes.js";
import { globalActions, homeIdentity } from "../../app/pageChrome.js";

export async function renderHome(
  context: PageContext,
): Promise<PageController> {
  const { app, collections, audio, navigate } = context;
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
      fixed: true,
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
    demoStatus: "方向键 / WASD 移动，体验 Engine 的地图规则。",
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
    resolveMapDocument({ collection: "original", id: "1-1" }),
    canvasReady,
  ]);
  session = await createGameSession({
    root: app,
    canvas,
    level: demo.level,
    gameOptions: {
      audio,
      profile: { superKey: true },
      assets: gameAssets(),
    },
    runtime: {
      hud: {
        hudAtlasUrl: siteUrl("assets/art/hd/hud.png"),
        goldenCarrotUrl: siteUrl("assets/art/hd/icon.png"),
      },
      input: {
        undo: false,
        debug: false,
        screenJoystick: { enabled: loadScreenControlPreference() },
      },
    },
  });
  const updateDemo = (): void => {
    if (!session?.game.hasLevel) return;
    const world = session.game.world;
    view.demoStatus = world.completed
      ? "Demo 完成，可以进入冒险模式。"
      : world.dead
        ? "Bobby 遇到了危险，可以重新开始。"
        : `方向键 / WASD 移动 · ${world.state.moves} 步 · 剩余目标 ${world.objectiveRemaining}`;
    view.demoResult = world.completed ? "complete" : world.dead ? "death" : null;
    view.deathReason = world.state.deathReason ?? "Bobby 没能继续前进。";
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
