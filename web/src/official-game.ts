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
import type { TinySynthAudioBackend } from "./TinySynthAudio.js";
import {
  fetchJson,
  type CatalogLevel,
  type LevelCatalog,
  type OfficialLevelData,
} from "./catalog.js";
import {
  escapeHtml,
  formatElapsed,
  gameAssets,
  NOOP_CONTROLLER,
  siteUrl,
  type Navigate,
  type PageController,
} from "./common.js";
import { loadAdventureSave, saveAdventureSave } from "./adventure-storage.js";
import {
  rememberExploreLevel,
  markExploreLevelCompleted,
} from "./explore-progress.js";
import { formatTileInspection } from "./game-debug.js";
import { createGameSession } from "./game-session.js";
import { displayLevelId } from "./pages.js";

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
  app.innerHTML =
    mode === "adventure"
      ? `<div class="adventure-desktop adventure-game-desktop"><div class="adventure-phone adventure-game-phone"><div class="adventure-phone-inner">${gamePageHtml(meta, audio, mode)}</div></div></div>`
      : gamePageHtml(meta, audio, mode);
  const canvas = required<HTMLCanvasElement>(app, "#game"),
    debugPanel = required<HTMLElement>(app, "#debug-panel"),
    debugEngine = required<HTMLElement>(debugPanel, ".debug-engine"),
    debugInspector = required<HTMLElement>(debugPanel, ".debug-inspector"),
    gameResult = required<HTMLDivElement>(app, "#game-result"),
    resultCard = required<HTMLElement>(gameResult, ".result-card"),
    hudTime = required<HTMLElement>(app, "#hud-time"),
    hudObjectives = required<HTMLElement>(app, "#hud-objectives"),
    hudObjectiveIcon = required<HTMLElement>(app, "#hud-objective-icon"),
    hudMoves = required<HTMLElement>(app, "#hud-moves"),
    hudItems = required<HTMLElement>(app, "#hud-items");
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
    inputOptions: {
      undo: mode === "explore",
      debug: mode === "explore",
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
  const renderHud = (): void => {
    if (!game.hasLevel) return;
    const world = game.world;
    hudTime.textContent = formatElapsed(performance.now() - levelStartedAt);
    hudObjectives.textContent = String(world.objectiveRemaining);
    hudObjectiveIcon.classList.toggle(
      "hud-carrot",
      world.state.objectiveMode === "carrot",
    );
    hudObjectiveIcon.classList.toggle(
      "hud-egg",
      world.state.objectiveMode !== "carrot",
    );
    hudMoves.textContent = String(world.state.moves);
    const items: string[] = [];
    if (world.state.profile.superKey || world.state.profile.temporaryKey)
      items.push(
        '<span class="item-chip" title="钥匙"><span class="hud-art hud-key" aria-hidden="true"></span></span>',
      );
    if (world.state.inventory.gas)
      items.push(
        '<span class="item-chip" title="汽油"><span class="hud-art hud-gas" aria-hidden="true"></span></span>',
      );
    if (world.state.inventory.shovel)
      items.push(
        '<span class="item-chip" title="雪铲"><span class="hud-art hud-shovel" aria-hidden="true"></span></span>',
      );
    if (world.state.inventory.kite)
      items.push(
        '<span class="item-chip" title="风筝"><span class="hud-art hud-kite" aria-hidden="true"></span></span>',
      );
    if (world.state.inventory.beans > 0)
      items.push(
        `<span class="item-chip" title="魔豆"><span class="hud-art hud-bean" aria-hidden="true"></span><strong>${world.state.inventory.beans}</strong></span>`,
      );
    if (world.state.goldenCarrotsInLevel > 0)
      items.push(
        `<span class="item-chip" title="本关金胡萝卜"><img class="hud-golden-carrot" src="assets/art/hd/icon.png" alt=""><strong>${world.state.goldenCarrotsInLevel}</strong></span>`,
      );
    if (world.state.bonusCoinsInLevel > 0)
      items.push(
        `<span class="item-chip" title="本关 Bonus Coin">BONUS <strong>${world.state.bonusCoinsInLevel}</strong></span>`,
      );
    const challengeRemainingMs = game.timedChallengeRemainingMs;
    if (challengeRemainingMs !== null)
      items.push(
        `<span class="item-chip bonus-time" title="限时挑战剩余时间"><strong>${Math.ceil(challengeRemainingMs / 1000)}s</strong></span>`,
      );
    hudItems.innerHTML = items.join("");
  };
  const update = (): void => {
    processAdventureRewards();
    renderHud();
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
  const uiTimer = window.setInterval(renderHud, 100);
  const askUndo = (): void => {
    if (mode === "explore" && game.canUndo && window.confirm("撤销上一步？")) {
      game.undo();
      closeResult();
    }
  };
  const askRestart = (): void => {
    if (!window.confirm("重新开始本关？当前进度会丢失。")) return;
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
  app
    .querySelector<HTMLButtonElement>("#back")
    ?.addEventListener("click", () =>
      navigate(
        mode === "adventure" ? `/adventure/chapter/${meta.chapter}` : "/levels",
      ),
    );
  app
    .querySelector<HTMLButtonElement>("#edit-level")
    ?.addEventListener("click", () => navigate(`/edit/${meta.publicId}`));
  app
    .querySelector<HTMLButtonElement>("#undo")
    ?.addEventListener("click", askUndo);
  app
    .querySelector<HTMLButtonElement>("#restart")
    ?.addEventListener("click", askRestart);
  bindAudioControls(app, audio);
  bindDialogs(app);
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
      window.clearInterval(uiTimer);
      if (mode === "adventure")
        window.removeEventListener("resize", applyAdventureCamera);
      session.destroy();
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
function gamePageHtml(
  meta: CatalogLevel,
  audio: TinySynthAudioBackend,
  mode: OfficialGameMode,
): string {
  return `<div class="game-page ${mode === "adventure" ? "original-adventure-game" : ""}"><header class="game-toolbar game-toolbar-v2"><div class="game-toolbar-left"><button id="back" class="icon-btn" title="返回" aria-label="返回">←</button><span class="level-label">${displayLevelId(meta)}</span><span class="difficulty-badge ${meta.difficulty.level} ${meta.difficulty.source}">${escapeHtml(meta.difficulty.label)}</span></div><div class="game-hud" aria-label="游戏状态"><span class="hud-chip"><strong id="hud-time">00:00</strong></span><span class="hud-chip"><span id="hud-objective-icon" class="hud-art hud-carrot" aria-hidden="true"></span><strong id="hud-objectives">—</strong></span><span id="hud-items" class="hud-items"></span></div><div class="game-toolbar-right"><span class="hud-chip step-chip"><strong id="hud-moves">0</strong><span class="hud-text-label">STEPS</span></span>${mode === "explore" ? '<button id="undo" class="icon-btn" title="撤销">↶</button>' : ""}<button id="restart" class="icon-btn" title="重新开始">↻</button><button id="music" class="icon-btn" title="音乐">${audio.isEnabled() ? "♫" : "♪̸"}</button>${mode === "explore" ? '<button id="edit-level" class="icon-btn" title="在编辑器中打开">✎</button>' : ""}<button id="game-settings" class="icon-btn" title="设置">⚙</button><button id="game-help" class="icon-btn" title="帮助">?</button></div></header><main class="game-stage"><canvas id="game"></canvas><div class="mobile-dpad" aria-label="移动方向"><button data-move="up">↑</button><button data-move="left">←</button><button data-move="down">↓</button><button data-move="right">→</button></div><aside id="debug-panel" class="debug-panel" aria-live="polite"><div class="debug-engine"></div><pre class="debug-inspector"></pre></aside><div id="game-result" class="game-result" hidden><section class="result-card" role="dialog" aria-modal="true"></section></div></main><dialog id="game-settings-dialog" class="game-dialog"><header><strong>设置</strong><button class="dialog-close icon-btn">×</button></header><label class="dialog-setting"><span>音乐</span><input id="game-music-enabled" type="checkbox" ${audio.isEnabled() ? "checked" : ""}></label><label class="dialog-setting"><span>音乐音量</span><input id="game-music-volume" type="range" min="0" max="100" value="${Math.round(audio.getMusicVolume() * 100)}"></label><label class="dialog-setting"><span>音效音量</span><input id="game-sound-volume" type="range" min="0" max="100" value="${Math.round(audio.getSoundVolume() * 100)}"></label></dialog><dialog id="game-help-dialog" class="game-dialog"><header><strong>${mode === "adventure" ? "Adventure" : "游玩"}帮助</strong><button class="dialog-close icon-btn">×</button></header><div class="help-list"><p><kbd>WASD</kbd> / <kbd>方向键</kbd>：移动。</p><p>鼠标/单指拖动地图；滚轮 / Pinch：缩放。</p>${mode === "adventure" ? "<p>Adventure 强制竖屏视野，并限制最小缩放，避免一次看到整张原版谜题地图。</p><p>Adventure 不提供 Undo；Bonus 的限时规则已经编码在地图机关实例中，由正式 Engine 执行。</p>" : "<p><kbd>~</kbd>：DEBUG；自由选关允许完整地图浏览和调试。</p>"}</div></dialog></div>`;
}
function bindAudioControls(
  root: ParentNode,
  audio: TinySynthAudioBackend,
): void {
  root
    .querySelector<HTMLButtonElement>("#music")
    ?.addEventListener("click", (event) => {
      audio.setEnabled(!audio.isEnabled());
      (event.currentTarget as HTMLButtonElement).textContent = audio.isEnabled()
        ? "♫"
        : "♪̸";
      const checkbox = root.querySelector<HTMLInputElement>(
        "#game-music-enabled",
      );
      if (checkbox) checkbox.checked = audio.isEnabled();
    });
  root
    .querySelector<HTMLInputElement>("#game-music-enabled")
    ?.addEventListener("change", (event) => {
      audio.setEnabled((event.currentTarget as HTMLInputElement).checked);
    });
  root
    .querySelector<HTMLInputElement>("#game-music-volume")
    ?.addEventListener("input", (event) =>
      audio.setMusicVolume(
        Number((event.currentTarget as HTMLInputElement).value) / 100,
      ),
    );
  root
    .querySelector<HTMLInputElement>("#game-sound-volume")
    ?.addEventListener("input", (event) =>
      audio.setSoundVolume(
        Number((event.currentTarget as HTMLInputElement).value) / 100,
      ),
    );
}
function bindDialogs(root: ParentNode): void {
  const settings = root.querySelector<HTMLDialogElement>(
      "#game-settings-dialog",
    ),
    help = root.querySelector<HTMLDialogElement>("#game-help-dialog");
  root
    .querySelector<HTMLButtonElement>("#game-settings")
    ?.addEventListener("click", () => settings?.showModal());
  root
    .querySelector<HTMLButtonElement>("#game-help")
    ?.addEventListener("click", () => help?.showModal());
  root
    .querySelectorAll<HTMLButtonElement>(".game-dialog .dialog-close")
    .forEach((button) =>
      button.addEventListener("click", () =>
        button.closest<HTMLDialogElement>("dialog")?.close(),
      ),
    );
  root.querySelectorAll<HTMLDialogElement>(".game-dialog").forEach((dialog) =>
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    }),
  );
}
function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Game UI failed to mount: ${selector}`);
  return element;
}
