import {
  campaignSequenceForChapter,
  claimPersistentReward,
  completeAdventureLevel,
  isAdventureLevelUnlocked,
  planAdventureSession,
  prepareAdventureLevel,
  type AdventureSave,
} from "@bobby/adventure";
import { ObjectId } from "@bobby/engine";
import { createApp } from "vue";
import type { TinySynthAudioBackend } from "../../services/audio/TinySynthAudio.js";
import {
  fetchJson,
  type CatalogLevel,
  type LevelCatalog,
  type OfficialLevelData,
} from "../../services/catalog/catalog.js";
import {
  NOOP_CONTROLLER,
  type Navigate,
  type PageController,
} from "../../app/pageContracts.js";
import { gameAssets, siteUrl } from "../../services/assets/gameAssets.js";
import { loadAdventureSave, saveAdventureSave } from "../../storage/adventureSaveStorage.js";
import {
  rememberExploreLevel,
  markExploreLevelCompleted,
} from "../../storage/exploreProgressStorage.js";
import { formatTileInspection } from "../../runtime/game/formatTileInspection.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import { displayLevelId } from "../../services/catalog/catalogPresentation.js";
import { escapeHtml, formatElapsed } from "./resultFormatting.js";
import OfficialGamePage from "./OfficialGamePage.vue";
import {
  loadScreenControlPreference,
  renderAppShell,
} from "../../shell/shellBridge.js";

export type OfficialGameMode = "explore" | "adventure";
export interface OfficialGameContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
  level: CatalogLevel;
  mode: OfficialGameMode;
}

export async function renderOfficialGame(
  context: OfficialGameContext,
): Promise<PageController> {
  const { app, catalog, audio, navigate, level: meta, mode } = context;
  let adventureSave: AdventureSave | null =
    mode === "adventure" ? loadAdventureSave() : null;
  if (
    adventureSave &&
    !isAdventureLevelUnlocked(adventureSave, meta.publicId)
  ) {
    navigate(`/adventure/chapter/${meta.chapter}`);
    return NOOP_CONTROLLER;
  }
  if (mode === "explore") rememberExploreLevel(meta.publicId);
  const official = await fetchJson<OfficialLevelData>(
    siteUrl(`assets/${meta.path}`),
  );
  const plan = adventureSave
    ? planAdventureSession(meta.publicId, adventureSave)
    : null;
  const sessionLevel = adventureSave
    ? prepareAdventureLevel(meta.publicId, official, adventureSave)
    : official;
  app.innerHTML = renderAppShell({
    mode,
    contextActions: gameContextActions(meta, mode),
    contextInfo:
      mode === "adventure"
        ? "WASD / 方向键移动 · 拖动查看地图"
        : "WASD / 方向键移动 · 拖动查看地图 · 滚轮缩放 · ~ DEBUG",
    topBarFixed: true,
    bottomBarFixed: true,
    content: "",
  });
  const gamePage = createApp(OfficialGamePage, { mode });
  gamePage.mount(app);
  const canvas = required<HTMLCanvasElement>(app, "#game"),
    debugPanel = required<HTMLElement>(app, "[data-debug-panel]"),
    debugEngine = required<HTMLElement>(debugPanel, ".debug-engine"),
    debugInspector = required<HTMLElement>(debugPanel, ".debug-inspector"),
    gameResult = required<HTMLDivElement>(app, "[data-result-overlay]"),
    resultCard = required<HTMLElement>(gameResult, "[data-result-card]");
  const productStats = app.querySelector<HTMLElement>("[data-product-stats]");
  const screenControlEnabled = loadScreenControlPreference();
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
  const { game, input } = session,
    isBonus = meta.contentKind === "bonus";
  audio.playMusic(isBonus ? "bonus" : `ingame${meta.number % 3}`);
  let levelStartedAt = performance.now(),
    debugInspection: string | null = null,
    visibleResult: "death" | "complete" | null = null,
    rewardsProcessed = "";
  const applyAdventureCamera = (): void => {
    if (mode !== "adventure") return;
    const width = Math.max(1, canvas.getBoundingClientRect().width),
      sourceTile = game.renderer.camera.sourceTileSize,
      minZoom = Math.max(0.72, width / (sourceTile * 9));
    game.setZoomLimits(minZoom, 2.75);
    if (game.zoom < minZoom) game.setZoom(minZoom);
  };
  applyAdventureCamera();
  if (mode === "adventure")
    window.addEventListener("resize", applyAdventureCamera);
  const processAdventureRewards = (): void => {
    if (!adventureSave) return;
    const signature = JSON.stringify(game.lastWorldEvents);
    if (signature === rewardsProcessed) return;
    rewardsProcessed = signature;
    let next = adventureSave;
    for (const event of game.lastWorldEvents) {
      if (event.x === undefined || event.y === undefined) continue;
      if (event.type === "collect-bonus-coin")
        next = claimPersistentReward(
          next,
          meta.publicId,
          ObjectId.BONUS_COIN,
          event.x,
          event.y,
        );
      else if (event.type === "collect-golden-carrot")
        next = claimPersistentReward(
          next,
          meta.publicId,
          ObjectId.GOLDEN_CARROT,
          event.x,
          event.y,
        );
    }
    if (next !== adventureSave) adventureSave = saveAdventureSave(next);
  };
  const closeResult = (): void => {
    visibleResult = null;
    gameResult.hidden = true;
  };
  const renderResult = (): void => {
    if (!game.hasLevel || game.isAnimating) return;
    const world = game.world,
      kind = world.dead ? "death" : world.completed ? "complete" : null;
    if (!kind) {
      closeResult();
      return;
    }
    if (visibleResult === kind) return;
    visibleResult = kind;
    if (kind === "complete") {
      let nextLevel: CatalogLevel | undefined;
      if (adventureSave) {
        adventureSave = saveAdventureSave(
          completeAdventureLevel(adventureSave, meta.publicId),
        );
        nextLevel = nextCampaignLevel(catalog, meta);
      } else {
        markExploreLevelCompleted(meta.canonicalId);
        nextLevel = nextCampaignLevel(catalog, meta);
      }
      resultCard.innerHTML = `<div class="result-kicker">${displayLevelId(meta)}</div><h2>关卡完成</h2><p>移动 ${world.state.moves} 步 · 用时 ${formatElapsed(performance.now() - levelStartedAt)} · 金胡萝卜 ${world.state.goldenCarrotsInLevel}</p><div class="result-actions">${nextLevel ? `<button class="primary-btn" data-result="next" data-next="${nextLevel.publicId}">下一关 · ${displayLevelId(nextLevel)}</button>` : ""}<button class="ghost-btn" data-result="replay">重玩</button><button class="ghost-btn" data-result="levels">${mode === "adventure" ? "章节列表" : "自由选关"}</button></div>`;
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
    const move = game.lastMove,
      engineMessage = move
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
    else if (action === "levels")
      navigate(
        mode === "adventure" ? `/adventure/chapter/${meta.chapter}` : "/levels",
      );
    else if (action === "next" && button.dataset.next)
      navigate(
        mode === "adventure"
          ? `/adventure/play/${button.dataset.next}`
          : `/play/${button.dataset.next}`,
      );
  });
  const onGameShellAction = (event: Event): void => {
    const action = (event as CustomEvent<{ action: string }>).detail.action;
    if (action === "back") {
      navigate(
        mode === "adventure" ? `/adventure/chapter/${meta.chapter}` : "/levels",
      );
    } else if (action === "edit") navigate(`/edit/${meta.publicId}`);
    else if (action === "undo") askUndo();
    else if (action === "restart") askRestart();
  };
  window.addEventListener("game-shell-action", onGameShellAction);
  const disposeGameShell = bindGameShell(input, screenControlEnabled);
  canvas.addEventListener("click", (event) => {
    if (
      mode !== "explore" ||
      !game.debug ||
      input.consumePointerClickSuppression()
    )
      return;
    const tile = game.inspectCanvasPoint(event.clientX, event.clientY);
    debugInspection = tile ? formatTileInspection(tile, game) : "DEBUG\n地图外";
    update();
  });
  return {
    destroy(): void {
      window.clearInterval(statisticsTimer);
      if (mode === "adventure")
        window.removeEventListener("resize", applyAdventureCamera);
      window.removeEventListener("game-shell-action", onGameShellAction);
      disposeGameShell();
      session.destroy();
      gamePage.unmount();
    },
  };
}

function nextCampaignLevel(
  catalog: LevelCatalog,
  meta: CatalogLevel,
): CatalogLevel | undefined {
  const sequence = campaignSequenceForChapter(meta.chapter),
    index = sequence.indexOf(meta.publicId);
  const next = sequence[index + 1];
  return next
    ? catalog.levels.find((level) => level.publicId === next)
    : undefined;
}
function gameContextActions(
  meta: CatalogLevel,
  mode: OfficialGameMode,
) {
  return [
    { id: "back", label: `← ${displayLevelId(meta)}`, title: "返回" },
    {
      label: meta.difficulty.label,
      className: `difficulty-badge ${meta.difficulty.level} ${meta.difficulty.source}`,
    },
    ...(mode === "explore"
      ? [{ id: "undo", label: "↶", title: "撤销" }]
      : []),
    { id: "restart", label: "↻", title: "重新开始" },
    ...(mode === "explore"
      ? [{ id: "edit", label: "✎", title: "在编辑器中打开" }]
      : []),
  ];
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
