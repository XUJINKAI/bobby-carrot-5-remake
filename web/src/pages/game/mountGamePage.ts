import {
  BONUS_KEY_TRIAL_EVENT,
  completeAdventureEvent,
  completeAdventureLevel,
  createAdventureLevelInstance,
  isAdventureLevelUnlocked,
  planAdventureProfile,
  planAdventureSession,
  setAdventureResumeLevel,
  type AdventureSave,
} from "@bobby/adventure";
import type { AudioRuntime, ImageManager } from "@bobby/engine";
import type { LevelMap } from "@bobby/model";
import { createApp } from "vue";
import type {
  AdventureIndex,
  AdventureIndexChapter,
  AdventureIndexLevel,
  AdventureIndexSpecialScene,
  MapMeta,
} from "../../services/catalog/catalog.js";
import {
  NOOP_CONTROLLER,
  type Navigate,
  type PageController,
} from "../../app/pageContracts.js";
import {
  loadAdventureSave,
  saveAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import {
  rememberExploreMap,
  markExploreMapCompleted,
} from "../../storage/exploreProgressStorage.js";
import { formatTileInspection } from "../../runtime/game/formatTileInspection.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { escapeHtml, formatElapsed } from "./resultFormatting.js";
import GamePage from "./GamePage.vue";
import {
  editorMapPath,
  exploreCollectionPath,
  explorePlayPath,
} from "../../app/routes.js";
import {
  configureShell,
  loadScreenControlPreference,
  type ShellConfig,
} from "../../shell/shellBridge.js";
import {
  GAME_HELP,
  globalActions,
  pageIdentity,
} from "../../app/pageChrome.js";

export type GamePageMode = "explore" | "adventure";

export interface GameIdentity {
  collection: string;
  id: string;
  title: string;
}

export interface GamePageContext {
  app: HTMLDivElement;
  adventure: AdventureIndex;
  audio: AudioRuntime;
  images: ImageManager;
  navigate: Navigate;
  level: LevelMap;
  identity: GameIdentity;
  mapMeta?: MapMeta;
  adventureChapter?: AdventureIndexChapter;
  adventureLevel?: AdventureIndexLevel;
  adventureScene?: AdventureIndexSpecialScene;
  adventureBackPath?: string;
  adventureHudEconomy?: boolean;
  mode: GamePageMode;
}

export async function renderGamePage(
  context: GamePageContext,
): Promise<PageController> {
  const {
    app,
    adventure,
    audio,
    images,
    navigate,
    level,
    identity,
    mapMeta,
    adventureChapter,
    adventureLevel,
    adventureScene,
    adventureBackPath,
    adventureHudEconomy,
    mode,
  } = context;
  const campaignNode = Boolean(adventureChapter && adventureLevel);
  if (mode === "adventure" && !campaignNode && !adventureScene) {
    throw new Error("Adventure GamePage 需要 Campaign node 或 Special Scene");
  }

  let adventureSave: AdventureSave | null =
    mode === "adventure" ? loadAdventureSave() : null;
  if (
    adventureSave &&
    campaignNode &&
    !isAdventureLevelUnlocked(adventureSave, adventureLevel!.id)
  ) {
    navigate(`/adventure/chapter/${adventureChapter!.id}`);
    return NOOP_CONTROLLER;
  }
  if (adventureSave && campaignNode) {
    const next = setAdventureResumeLevel(adventureSave, adventureLevel!.id);
    if (next.campaign.resumeLevelId !== adventureSave.campaign.resumeLevelId)
      adventureSave = saveAdventureSave(next);
  }
  if (mode === "explore") {
    rememberExploreMap(identity.collection, identity.id);
  }

  const plan = adventureSave
    ? campaignNode
      ? planAdventureSession(adventureLevel!.id, adventureSave)
      : planAdventureProfile(adventureSave)
    : null;
  const sessionLevel = adventureSave && campaignNode
    ? createAdventureLevelInstance(adventureLevel!.id, level, adventureSave)
    : level;
  const screenControlEnabled = loadScreenControlPreference();
  configureShell(
    gameShellConfig(identity, mode, screenControlEnabled),
    GAME_HELP,
  );
  app.replaceChildren();
  const gamePage = createApp(GamePage, { mode });
  gamePage.mount(app);

  const canvas = required<HTMLCanvasElement>(app, "#game");
  const debugPanel = required<HTMLElement>(app, "[data-debug-panel]");
  const debugEngine = required<HTMLElement>(debugPanel, ".debug-engine");
  const debugInspector = required<HTMLElement>(debugPanel, ".debug-inspector");
  const gameResult = required<HTMLDivElement>(app, "[data-result-overlay]");
  const resultCard = required<HTMLElement>(gameResult, "[data-result-card]");
  const productStats = app.querySelector<HTMLElement>("[data-product-stats]");

  const session = await createGameSession({
    canvas,
    level: sessionLevel,
    gameOptions: {
      audio,
      images,
      ...(adventureSave
        ? {
            profile: {
              superKey: plan!.capabilities.goldenKey,
              speedShoes: plan!.capabilities.speedShoes,
              coinRadar: plan!.capabilities.coinRadar,
              bonusKeyTrialUsed: plan!.capabilities.bonusKeyTrialUsed,
            },
            economy: plan!.economy,
          }
        : { profile: { superKey: true } }),
    },
    runtime: {
      hud:
        mode === "adventure"
          ? {
              objective: true,
              inventory: true,
              economy: adventureHudEconomy === true,
            }
          : { objective: true, inventory: true, economy: true },
      input: {
        undo: mode === "explore",
        debug: mode === "explore",
        screenJoystick: {
          enabled: screenControlEnabled,
        },
      },
    },
  });
  const { game, input } = session;
  const isBonus = adventureLevel?.id.includes("-bonus-") ?? false;
  audio.playMusic(mapMeta?.music ?? (isBonus ? "bonus" : "ingame1"));

  let levelStartedAt = performance.now();
  let debugInspection: string | null = null;
  let visibleResult: "death" | "complete" | null = null;
  let persistedAdventureSignature = "";

  const applyAdventureCamera = (): void => {
    if (mode !== "adventure") return;
    const width = Math.max(1, canvas.getBoundingClientRect().width);
    const minZoom = Math.max(0.72, width / (game.sourceTileSize * 9));
    game.setZoomLimits(minZoom, 2.75);
    if (game.zoom < minZoom) game.setZoom(minZoom);
  };
  applyAdventureCamera();
  if (mode === "adventure") {
    window.addEventListener("resize", applyAdventureCamera);
  }

  const persistAdventureSession = (): void => {
    if (!adventureSave || !game.hasLevel) return;
    const state = game.state;
    const signature = JSON.stringify({
      economy: state.economy,
      bonusKeyTrialUsed: state.profile.bonusKeyTrialUsed,
    });
    if (signature === persistedAdventureSignature) return;
    persistedAdventureSignature = signature;
    let next = structuredClone(adventureSave);
    next.economy = { ...state.economy };
    if (
      state.profile.bonusKeyTrialUsed &&
      !next.campaign.completedEvents.includes(BONUS_KEY_TRIAL_EVENT)
    ) {
      next = completeAdventureEvent(next, BONUS_KEY_TRIAL_EVENT);
    }
    adventureSave = saveAdventureSave(next);
  };

  const closeResult = (): void => {
    visibleResult = null;
    gameResult.hidden = true;
  };

  const renderResult = (): void => {
    if (!game.hasLevel || game.isAnimating) return;
    const state = game.state;
    const kind =
      state.status === "dead"
        ? "death"
        : state.status === "won"
          ? "complete"
          : null;
    if (!kind) {
      closeResult();
      return;
    }
    if (visibleResult === kind) return;
    visibleResult = kind;
    if (kind === "complete") {
      let nextId: string | undefined;
      if (adventureSave && campaignNode) {
        adventureSave = saveAdventureSave(
          completeAdventureLevel(adventureSave, adventureLevel!.id),
        );
        nextId = nextAdventureLevel(adventure, adventureLevel!.id)?.id;
      } else if (mode === "explore") {
        markExploreMapCompleted(identity.collection, identity.id);
        nextId = mapMeta?.next;
      }
      resultCard.innerHTML = `<div class="result-kicker">${escapeHtml(identity.title)}</div><h2>关卡完成</h2><p>移动 ${state.moves} 步 · 用时 ${formatElapsed(performance.now() - levelStartedAt)}</p><div class="result-actions">${nextId ? `<button class="primary-btn" data-result="next" data-next="${escapeHtml(nextId)}">下一关 · ${escapeHtml(nextId.toUpperCase())}</button>` : ""}<button class="ghost-btn" data-result="replay">重玩</button><button class="ghost-btn" data-result="levels">${mode === "adventure" ? "返回冒险模式" : "自由探索"}</button></div>`;
    } else {
      resultCard.innerHTML = `<div class="result-kicker danger">BOBBY FAILED</div><h2>失败</h2><p>${escapeHtml(state.deathReason ?? "Bobby 没能继续前进。")}</p><div class="result-actions">${mode === "explore" && game.canUndo ? '<button class="primary-btn" data-result="undo">撤销这一步</button>' : ""}<button class="ghost-btn" data-result="retry">重新开始</button><button class="ghost-btn" data-result="levels">返回</button></div>`;
    }
    gameResult.hidden = false;
  };

  const update = (): void => {
    persistAdventureSession();
    if (productStats && game.hasLevel) {
      productStats.textContent = `${formatElapsed(performance.now() - levelStartedAt)} · ${game.state.moves} STEPS`;
    }
    debugPanel.classList.toggle("visible", mode === "explore" && game.debug);
    const move = game.lastMove;
    const engineMessage = move
      ? `${move.moved ? "移动" : "阻挡"} · ${move.passage.reason} [${move.passage.confidence}]`
      : "Engine: no passage yet";
    debugEngine.textContent =
      mode === "explore" && game.debug
        ? `ENGINE MESSAGE\n${engineMessage}`
        : "";
    debugInspector.textContent =
      mode === "explore" && game.debug
        ? (debugInspection ?? "DEBUG\n点击地图格查看详情")
        : "";
    renderResult();
  };
  game.on("change", update);
  game.on("debug-change", () => {
    if (!game.debug) debugInspection = null;
    update();
  });
  update();
  const statisticsTimer = window.setInterval(update, 250);

  const askUndo = (): void => {
    if (mode === "explore" && game.canUndo) {
      game.undo();
      closeResult();
    }
  };
  const askRedo = (): void => {
    if (mode === "explore" && game.canRedo) {
      game.redo();
      closeResult();
    }
  };
  const askRestart = (): void => {
    persistAdventureSession();
    game.restart();
    levelStartedAt = performance.now();
    debugInspection = null;
    closeResult();
    update();
  };

  gameResult.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-result]",
    );
    if (!button) return;
    const action = button.dataset.result;
    if (action === "undo") askUndo();
    else if (action === "retry" || action === "replay") askRestart();
    else if (action === "levels") {
      navigate(backPath(identity, mode, adventureBackPath));
    } else if (action === "next" && button.dataset.next) {
      navigate(
        mode === "adventure"
          ? `/adventure/play/${button.dataset.next}`
          : explorePlayPath({
              collection: identity.collection,
              id: button.dataset.next,
            }),
      );
    }
  });

  const onGameShellAction = (event: Event): void => {
    const action = (event as CustomEvent<{ action: string }>).detail.action;
    if (action === "back") {
      persistAdventureSession();
      navigate(backPath(identity, mode, adventureBackPath));
    } else if (action === "edit") {
      navigate(
        identity.collection === "imported" ? "/edit" : editorMapPath(identity),
      );
    } else if (action === "undo") askUndo();
    else if (action === "redo") askRedo();
    else if (action === "restart") askRestart();
  };
  window.addEventListener("game-shell-action", onGameShellAction);
  const disposeGameShell = bindGameShell(input, screenControlEnabled);

  canvas.addEventListener("click", (event) => {
    if (
      mode !== "explore" ||
      !game.debug ||
      input.consumePointerClickSuppression()
    ) {
      return;
    }
    const tile = game.inspectCanvasPoint(event.clientX, event.clientY);
    debugInspection = tile ? formatTileInspection(tile, game) : "DEBUG\n地图外";
    update();
  });

  return {
    destroy(): void {
      persistAdventureSession();
      window.clearInterval(statisticsTimer);
      if (mode === "adventure") {
        window.removeEventListener("resize", applyAdventureCamera);
      }
      window.removeEventListener("game-shell-action", onGameShellAction);
      disposeGameShell();
      session.destroy();
      gamePage.unmount();
    },
  };
}

function nextAdventureLevel(
  adventure: AdventureIndex,
  currentId: string,
): AdventureIndexLevel | undefined {
  const levels = adventure.chapters.flatMap((chapter) => chapter.levels);
  const index = levels.findIndex((level) => level.id === currentId);
  return index >= 0 ? levels[index + 1] : undefined;
}

function gameShellConfig(
  identity: GameIdentity,
  mode: GamePageMode,
  screenControlEnabled: boolean,
): ShellConfig {
  const explore = mode === "explore";
  return {
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity(
        explore ? "自由探索模式" : "冒险模式",
        explore ? "/explore" : "/adventure",
        false,
      ),
      back: {
        id: "back",
        icon: "back",
        label: identity.title,
        title: "返回",
      },
      commands: [
        ...(explore
          ? [
              { id: "undo", icon: "undo" as const, title: "撤销" },
              { id: "redo", icon: "redo" as const, title: "重做" },
            ]
          : []),
        { id: "restart", icon: "restart", title: "重新开始" },
      ],
      actions: [
        ...(explore
          ? [
              {
                id: "edit",
                icon: "edit" as const,
                label: "编辑地图",
                title: "在编辑器中打开",
                collapse: "overflow" as const,
              },
            ]
          : []),
        ...globalActions(),
      ],
    },
    bottomBar: {
      visible: true,
      fixed: true,
      info: [
        { text: identity.title },
        {
          text: explore
            ? "WASD / 方向键移动 · 拖动查看 · 滚轮缩放 · ~ DEBUG"
            : "WASD / 方向键移动 · 拖动查看地图",
        },
      ],
      trailing: [
        {
          id: "screen-control",
          label: "屏幕摇杆",
          pressed: screenControlEnabled,
        },
      ],
    },
  };
}

function backPath(
  identity: GameIdentity,
  mode: GamePageMode,
  adventureBackPath?: string,
): string {
  return mode === "adventure"
    ? (adventureBackPath ?? "/adventure")
    : identity.collection === "imported"
      ? "/"
      : exploreCollectionPath(identity.collection);
}

function bindGameShell(
  input: {
    setEnabled(value: boolean): void;
    setScreenJoystickEnabled(value: boolean): void;
  },
  initialScreenControlEnabled: boolean,
): () => void {
  let screenControlEnabled = initialScreenControlEnabled;
  const updateScreenControl = (): void => {
    input.setScreenJoystickEnabled(screenControlEnabled);
  };
  updateScreenControl();
  const onScreenControlChange = (event: Event): void => {
    screenControlEnabled = Boolean(
      (event as CustomEvent<{ enabled: boolean }>).detail.enabled,
    );
    updateScreenControl();
  };
  const onDialogOpen = (): void => input.setEnabled(false);
  const onDialogClose = (): void => input.setEnabled(true);
  window.addEventListener("screen-control-change", onScreenControlChange);
  window.addEventListener("shell-dialog-open", onDialogOpen);
  window.addEventListener("shell-dialog-close", onDialogClose);
  return () => {
    window.removeEventListener("screen-control-change", onScreenControlChange);
    window.removeEventListener("shell-dialog-open", onDialogOpen);
    window.removeEventListener("shell-dialog-close", onDialogClose);
  };
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Game UI failed to mount: ${selector}`);
  return element;
}
