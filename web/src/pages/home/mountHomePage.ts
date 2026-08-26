import { parseEditorLevel, serializeEditorLevel } from "@bobby/editor";
import { createApp, reactive } from "vue";
import type { PageContext, PageController } from "../../app/pageContracts.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { gameAssets, siteUrl } from "../../services/assets/gameAssets.js";
import type { OfficialLevelData } from "../../services/catalog/catalog.js";
import { fetchJson } from "../../services/catalog/catalog.js";
import { displayLevelId } from "../../services/catalog/catalogPresentation.js";
import {
  randomCatalogLevel,
  resolveCatalogLevel,
} from "../../services/catalog/catalogSelection.js";
import { lastExploreLevelId } from "../../storage/exploreProgressStorage.js";
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
  const { app, catalog, audio, navigate } = context;
  const last = resolveCatalogLevel(catalog, lastExploreLevelId());
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
    lastLevelId: displayLevelId(last),
    onReady: (canvas: HTMLCanvasElement) => resolveCanvas(canvas),
    onNavigate: navigate,
    onRestart: () => session?.game.restart(),
    onRandom: () =>
      navigate(
        explorePlayPath({
          collection: "original",
          id: randomCatalogLevel(catalog).publicId,
        }),
      ),
    onImportMap: (level: ReturnType<typeof parseEditorLevel>) =>
      importHomeMap(level, view, navigate),
  });
  homeApp.mount(app);
  const demoMeta =
    catalog.levels.find((level) => level.publicId === "1-1") ?? last;
  const [demoLevel, canvas] = await Promise.all([
    fetchJson<OfficialLevelData>(siteUrl(`assets/${demoMeta.path}`)),
    canvasReady,
  ]);
  session = await createGameSession({
    root: app,
    canvas,
    level: demoLevel,
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
  navigate("/explore/play/imported/shared-map");
}
