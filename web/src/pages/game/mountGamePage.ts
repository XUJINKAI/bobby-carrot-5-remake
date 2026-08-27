import {
  claimPersistentReward,
  completeAdventureLevel,
  isAdventureLevelUnlocked,
  planAdventureSession,
  createAdventureLevelInstance,
  type AdventureSave,
} from "@bobby/adventure";
import { EntityTypeId, type LevelMap } from "@bobby/model";
import { createApp } from "vue";
import type { TinySynthAudioBackend } from "../../services/audio/TinySynthAudio.js";
import type {
  AdventureIndex,
  AdventureIndexChapter,
  AdventureIndexLevel,
  MapMeta,
} from "../../services/catalog/catalog.js";
import {
  NOOP_CONTROLLER,
  type Navigate,
  type PageController,
} from "../../app/pageContracts.js";
import { gameAssets, siteUrl } from "../../services/assets/gameAssets.js";
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
  audio: TinySynthAudioBackend;
  navigate: Navigate;
  level: LevelMap;
  identity: GameIdentity;
  mapMeta?: MapMeta;
  adventureChapter?: AdventureIndexChapter;
  adventureLevel?: AdventureIndexLevel;
  mode: GamePageMode;
}

export async function renderGamePage(
  context: GamePageContext,
): Promise<PageController> {
  const {
    app,
    audio,
    navigate,
    level,
    identity,
    mapMeta,
    adventureChapter,
    adventureLevel,
    mode,
  } = context;
  if (mode === "adventure" && (!adventureChapter || !adventureLevel)) {
    throw new Error("Adventure GamePage 需要 Campaign node");
  }

  let adventureSave: AdventureSave | null =
    mode === "adventure" ? loadAdventureSave() : null;
  if (
    adventureSave &&
    !isAdventureLevelUnlocked(adventureSave, adventureLevel!.id)
  ) {
    navigate(`/adventure/chapter/${adventureChapter!.id}`);
    return NOOP_CONTROLLER;
  }
  if (mode === "explore") {
    rememberExploreMap(identity.collection, identity.id);
  }

  const plan = adventureSave
    ? planAdventureSession(adventureLevel!.id, adventureSave)
    : null;
  const sessionLevel = adventureSave
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
    root: app,
    canvas,
    level: sessionLevel,
    gameOptions: {
      audio,
      profile: adventureSave
        ? {
            superKey: plan!.capabilities.goldenKey,
            speedShoes: plan!.capabilities.speedShoes,
          }
        : { superKey: true },
      assets: gameAssets(),
    },
    runtime: {
      hud: {
        hudAtlasUrl: siteUrl("assets/art/hd/hud.png"),
        goldenCarrotUrl: siteUrl("assets/art/hd/icon.png"),
      },
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
  let rewardsProcessed = "";

  const applyAdventureCamera = (): void => {
    if (mode !== "adventure") return;
    const width = Math.max(1, canvas.getBoundingClientRect().width);
    const sourceTile = game.renderer.camera.sourceTileSize;
    const minZoom = Math.max(0.72, width / (sourceTile * 9));
    game.setZoomLimits(minZoom, 2.75);
    if (game.zoom < minZoom) game.setZoom(minZoom);
  };
  applyAdventureCamera();
  if (mode === "adventure") {
    window.addEventListener("resize", applyAdventureCamera);
  }

  const processAdventureRewards = (): void => {
    if (!adventureSave || !adventureLevel) return;
    const signature = JSON.stringify(game.lastWorldEvents);
    if (signature === rewardsProcessed) return;
    rewardsProcessed = signature;
    let next = adventureSave;
    for (const event of game.lastWorldEvents) {
      if (event.x === undefined || event.y === undefined) continue;
      if (event.type === "collect-bonus-coin") {
        next = claimPersistentReward(
          next,
          adventureLevel.id,
          EntityTypeId.BONUS_COIN,
          event.x,
          event.y,
        );
      } else if (event.type === "collect-golden-carrot") {
        next = claimPersistentReward(
          next,
          adventureLevel.id,
          EntityTypeId.GOLDEN_CARROT,
          event.x,
          event.y,
        );
      }
    }
    if (next !== adventureSave) adventureSave = saveAdventureSave(next);
  };

  const closeResult = (): void => {
    visibleResult = null;
    gameResult.hidden = true;
  };

  const renderResult = (): void => {
    if (!game.hasLevel || game.isAnimating) return;
    const world = game.world;
    const kind = world.dead ? "death" : world.completed ? "complete" : null;
    if (!kind) {
      closeResult();
      return;
    }
    if (visibleResult === kind) return;
    visibleResult = kind;
    if (kind === "complete") {
      let nextId: string | undefined;
      if (adventureSave && adventureLevel && adventureChapter) {
        adventureSave = saveAdventureSave(
          completeAdventureLevel(adventureSave, adventureLevel.id),
        );
        nextId = nextAdventureLevel(adventureChapter, adventureLevel.id)?.id;
      } else {
        markExploreMapCompleted(identity.collection, identity.id);
        nextId = mapMeta?.next;
      }
      resultCard.innerHTML = `<div class="result-kicker">${escapeHtml(identity.title)}</div><h2>关卡完成</h2><p>移动 ${world.state.moves} 步 · 用时 ${formatElapsed(performance.now() - levelStartedAt)} · 金胡萝卜 ${world.state.goldenCarrotsInLevel}</p><div class="result-actions">${nextId ? `<button class="primary-btn" data-result="next" data-next="${escapeHtml(nextId)}">下一关 · ${escapeHtml(nextId.toUpperCase())}</button>` : ""}<button class="ghost-btn" data-result="replay">重玩</button><button class="ghost-btn" data-result="levels">${mode === "adventure" ? "章节列表" : "自由探索"}</button></div>`;
    } else {
      resultCard.innerHTML = `<div class="result-kicker danger">BOBBY FAILED</div><h2>失败</h2><p>${escapeHtml(world.state.deathReason ?? "Bobby 没能继续前进。")}</p><div class="result-actions">${mode === "explore" && game.canUndo ? '<button class="primary-btn" data-result="undo">撤销这一步</button>' : ""}<button class="ghost-btn" data-result="retry">重新开始</button><button class="ghost-btn" data-result="levels">返回</button></div>`;
    }
    gameResult.hidden = false;
  };

  const update = (): void => {
    processAdventureRewards();
    if (productStats && game.hasLevel) {
      productStats.textContent = `${formatElapsed(performance.now() - levelStartedAt)} · ${game.world.state.moves} STEPS`;
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
    game.restart();
    levelStartedAt = performance.now();
    debugInspection = null;
    rewardsProcessed = "";
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
      navigate(backPath(identity, adventureChapter, mode));
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
      navigate(backPath(identity, adventureChapter, mode));
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
  chapter: AdventureIndexChapter,
  currentId: string,
): AdventureIndexLevel | undefined {
  const index = chapter.levels.findIndex((level) => level.id === currentId);
  return index >= 0 ? chapter.levels[index + 1] : undefined;
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
  chapter: AdventureIndexChapter | undefined,
  mode: GamePageMode,
): string {
  return mode === "adventure"
    ? `/adventure/chapter/${chapter!.id}`
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
