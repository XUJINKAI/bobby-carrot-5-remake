import { ObjectId } from '@bobby/engine';
import type { TinySynthAudioBackend } from './TinySynthAudio.js';
import { fetchJson, type CatalogLevel, type LevelCatalog, type OfficialLevelData } from './catalog.js';
import { escapeHtml, formatElapsed, gameAssets, NOOP_CONTROLLER, siteUrl, type Navigate, type PageController } from './common.js';
import { formatTileInspection } from './game-debug.js';
import { createGameSession } from './game-session.js';
import { bankLevelRewards, loadProfile, markLevelCompleted, saveProfile, type PlayerProfile } from './profile.js';
import { displayLevelId } from './pages.js';

export interface OfficialGameContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
  level: CatalogLevel;
}

export async function renderOfficialGame(context: OfficialGameContext): Promise<PageController> {
  const { app, catalog, audio, navigate, level: meta } = context;
  localStorage.setItem('bobby.lastLevel', meta.publicId);
  localStorage.setItem('bobby.selectedRelease', meta.release);
  app.innerHTML = gamePageHtml(meta, audio);

  const canvas = required<HTMLCanvasElement>(app, '#game');
  const debugPanel = required<HTMLElement>(app, '#debug-panel');
  const debugEngine = required<HTMLElement>(debugPanel, '.debug-engine');
  const debugInspector = required<HTMLElement>(debugPanel, '.debug-inspector');
  const gameResult = required<HTMLDivElement>(app, '#game-result');
  const resultCard = required<HTMLElement>(gameResult, '.result-card');
  const hudTime = required<HTMLElement>(app, '#hud-time');
  const hudObjectives = required<HTMLElement>(app, '#hud-objectives');
  const hudObjectiveIcon = required<HTMLElement>(app, '#hud-objective-icon');
  const hudMoves = required<HTMLElement>(app, '#hud-moves');
  const hudItems = required<HTMLElement>(app, '#hud-items');

  const official = await fetchJson<OfficialLevelData>(siteUrl(`assets/${meta.path}`));
  const profile = loadProfile();
  const isBonus = meta.chapterLevel > 10;
  const hasLock = official.objects.some((object) => object.type === ObjectId.LOCK);
  let temporaryKey = false;
  if (isBonus && hasLock && !profile.superKey) {
    const access = await requestBonusAccess(profile, gameResult, resultCard);
    if (!access) {
      navigate('/levels');
      return NOOP_CONTROLLER;
    }
    temporaryKey = true;
  }

  const session = await createGameSession({
    root: app,
    canvas,
    level: official,
    gameOptions: {
      audio,
      profile: { superKey: profile.superKey, temporaryKey, speedShoes: profile.speedShoes },
      assets: gameAssets()
    },
    loadOptions: isBonus ? { bonusTimeMs: 60_000 } : {}
  });
  const { game, input } = session;
  audio.playMusic(isBonus ? 'bonus' : `ingame${meta.number % 3}`);

  let levelStartedAt = performance.now();
  let debugInspection: string | null = null;
  let visibleResult: 'death' | 'complete' | null = null;

  const closeResult = (): void => {
    visibleResult = null;
    gameResult.hidden = true;
  };

  const renderResult = (): void => {
    if (!game.hasLevel || game.isAnimating) return;
    const world = game.world;
    const kind = world.dead ? 'death' : world.completed ? 'complete' : null;
    if (!kind) {
      closeResult();
      return;
    }
    if (visibleResult === kind) return;
    visibleResult = kind;
    if (kind === 'complete') {
      markLevelCompleted(meta.canonicalId);
      bankLevelRewards(meta.canonicalId, world.state.bonusCoinsInLevel, world.state.goldenCarrotsInLevel);
      const index = catalog.levels.findIndex((entry) => entry.canonicalId === meta.canonicalId);
      const next = catalog.levels[index + 1];
      resultCard.innerHTML = `<div class="result-kicker">${displayLevelId(meta)}</div><h2>关卡完成</h2><p>移动 ${world.state.moves} 步 · 用时 ${formatElapsed(performance.now() - levelStartedAt)} · 金胡萝卜 ${world.state.goldenCarrotsInLevel}</p><div class="result-actions">${next ? `<button class="primary-btn" data-result="next" data-next="${next.publicId}">下一关 · ${displayLevelId(next)}</button>` : ''}<button class="ghost-btn" data-result="replay">重玩</button><button class="ghost-btn" data-result="levels">关卡列表</button></div>`;
    } else {
      resultCard.innerHTML = `<div class="result-kicker danger">BOBBY FAILED</div><h2>失败</h2><p>${escapeHtml(world.state.deathReason ?? 'Bobby 没能继续前进。')}</p><div class="result-actions">${game.canUndo ? '<button class="primary-btn" data-result="undo">撤销这一步</button>' : ''}<button class="ghost-btn" data-result="retry">重新开始</button><button class="ghost-btn" data-result="levels">关卡列表</button></div>`;
    }
    gameResult.hidden = false;
  };

  const renderHud = (): void => {
    if (!game.hasLevel) return;
    const world = game.world;
    hudTime.textContent = formatElapsed(performance.now() - levelStartedAt);
    hudObjectives.textContent = String(world.objectiveRemaining);
    hudObjectiveIcon.classList.toggle('hud-carrot', world.state.objectiveMode === 'carrot');
    hudObjectiveIcon.classList.toggle('hud-egg', world.state.objectiveMode !== 'carrot');
    hudMoves.textContent = String(world.state.moves);
    const items: string[] = [];
    if (world.state.profile.superKey || world.state.profile.temporaryKey) items.push('<span class="item-chip" title="钥匙"><span class="hud-art hud-key" aria-hidden="true"></span></span>');
    if (world.state.inventory.gas) items.push('<span class="item-chip" title="汽油"><span class="hud-art hud-gas" aria-hidden="true"></span></span>');
    if (world.state.inventory.shovel) items.push('<span class="item-chip" title="雪铲"><span class="hud-art hud-shovel" aria-hidden="true"></span></span>');
    if (world.state.inventory.kite) items.push('<span class="item-chip" title="风筝"><span class="hud-art hud-kite" aria-hidden="true"></span></span>');
    if (world.state.inventory.beans > 0) items.push(`<span class="item-chip" title="魔豆"><span class="hud-art hud-bean" aria-hidden="true"></span><strong>${world.state.inventory.beans}</strong></span>`);
    if (world.state.goldenCarrotsInLevel > 0) items.push(`<span class="item-chip" title="本关金胡萝卜"><img class="hud-golden-carrot" src="assets/art/hd/icon.png" alt=""><strong>${world.state.goldenCarrotsInLevel}</strong></span>`);
    if (world.state.bonusCoinsInLevel > 0) items.push(`<span class="item-chip" title="本关 Bonus Coin">BONUS <strong>${world.state.bonusCoinsInLevel}</strong></span>`);
    if (world.state.bonusTimeRemainingMs !== null) items.push(`<span class="item-chip bonus-time" title="Bonus 剩余时间"><strong>${Math.ceil(world.state.bonusTimeRemainingMs / 1000)}s</strong></span>`);
    hudItems.innerHTML = items.join('');
  };

  const update = (): void => {
    renderHud();
    debugPanel.classList.toggle('visible', game.debug);
    const move = game.lastMove;
    const engineMessage = move ? `${move.moved ? '移动' : '阻挡'} · ${move.passage.reason} [${move.passage.confidence}]` : 'Engine: no passage yet';
    debugEngine.textContent = game.debug ? `ENGINE MESSAGE\n${engineMessage}` : '';
    debugInspector.textContent = game.debug ? (debugInspection ?? 'DEBUG\n点击地图格查看详情') : '';
    renderResult();
  };

  game.on('change', update);
  game.on('debug-change', () => {
    if (!game.debug) debugInspection = null;
    update();
  });
  update();
  const uiTimer = window.setInterval(renderHud, 250);

  const askUndo = (): void => {
    if (game.canUndo && window.confirm('撤销上一步？')) {
      game.undo();
      closeResult();
    }
  };
  const askRestart = (): void => {
    if (!window.confirm('重新开始本关？当前进度会丢失。')) return;
    game.restart();
    levelStartedAt = performance.now();
    debugInspection = null;
    closeResult();
    update();
  };

  gameResult.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-result]');
    if (!button) return;
    const action = button.dataset.result;
    if (action === 'undo') askUndo();
    else if (action === 'retry' || action === 'replay') askRestart();
    else if (action === 'levels') navigate('/levels');
    else if (action === 'next' && button.dataset.next) navigate(`/play/${button.dataset.next}`);
  });
  app.querySelector<HTMLButtonElement>('#back')?.addEventListener('click', () => navigate('/levels'));
  app.querySelector<HTMLButtonElement>('#edit-level')?.addEventListener('click', () => navigate(`/edit/${meta.publicId}`));
  app.querySelector<HTMLButtonElement>('#undo')?.addEventListener('click', askUndo);
  app.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', askRestart);
  bindAudioControls(app, audio);
  bindDialogs(app);
  canvas.addEventListener('click', (event) => {
    if (!game.debug || input.consumePointerClickSuppression()) return;
    const tile = game.inspectCanvasPoint(event.clientX, event.clientY);
    debugInspection = tile ? formatTileInspection(tile, game) : 'DEBUG\n地图外';
    update();
  });

  return {
    destroy(): void {
      window.clearInterval(uiTimer);
      session.destroy();
    }
  };
}

function gamePageHtml(meta: CatalogLevel, audio: TinySynthAudioBackend): string {
  return `<div class="game-page"><header class="game-toolbar game-toolbar-v2"><div class="game-toolbar-left"><button id="back" class="icon-btn" title="选择关卡" aria-label="选择关卡">←</button><span class="level-label">${displayLevelId(meta)}</span><span class="difficulty-badge ${meta.difficulty.level} ${meta.difficulty.source}">${escapeHtml(meta.difficulty.label)}</span><button id="level-info" class="icon-btn" title="关卡信息" aria-label="关卡信息">ⓘ</button></div><div class="game-hud" aria-label="游戏状态"><span class="hud-chip" title="本次游玩时间"><strong id="hud-time">00:00</strong></span><span class="hud-chip" title="剩余主要目标"><span id="hud-objective-icon" class="hud-art hud-carrot" aria-hidden="true"></span><strong id="hud-objectives">—</strong></span><span id="hud-items" class="hud-items" aria-label="已取得物品"></span></div><div class="game-toolbar-right"><span class="hud-chip step-chip" title="移动步数"><strong id="hud-moves">0</strong><span class="hud-text-label">STEPS</span></span><button id="undo" class="icon-btn" title="撤销上一步">↶</button><button id="restart" class="icon-btn" title="重新开始本关">↻</button><button id="music" class="icon-btn" title="音乐开关">${audio.isEnabled() ? '♫' : '♪̸'}</button><button id="edit-level" class="icon-btn" title="在编辑器中打开">✎</button><button id="game-settings" class="icon-btn" title="设置">⚙</button><button id="game-help" class="icon-btn" title="游玩帮助">?</button></div></header><main class="game-stage"><canvas id="game"></canvas><div class="mobile-dpad" aria-label="移动方向"><button data-move="up">↑</button><button data-move="left">←</button><button data-move="down">↓</button><button data-move="right">→</button></div><aside id="debug-panel" class="debug-panel" aria-live="polite"><div class="debug-engine"></div><pre class="debug-inspector"></pre></aside><div id="game-result" class="game-result" hidden><section class="result-card" role="dialog" aria-modal="true"></section></div></main><dialog id="level-info-dialog" class="game-dialog"><header><strong>关卡信息</strong><button class="dialog-close icon-btn">×</button></header><dl class="info-grid"><dt>关卡</dt><dd>${displayLevelId(meta)}</dd><dt>章节</dt><dd>${escapeHtml(meta.chapterTitle)}</dd><dt>难度</dt><dd>${escapeHtml(meta.difficulty.label)}</dd><dt>地图</dt><dd>${meta.width} × ${meta.height}</dd></dl>${meta.chapterDescription ? `<p class="muted">${escapeHtml(meta.chapterDescription)}</p>` : ''}</dialog><dialog id="game-settings-dialog" class="game-dialog"><header><strong>设置</strong><button class="dialog-close icon-btn">×</button></header><label class="dialog-setting"><span>音乐</span><input id="game-music-enabled" type="checkbox" ${audio.isEnabled() ? 'checked' : ''}></label><label class="dialog-setting"><span>音乐音量</span><input id="game-music-volume" type="range" min="0" max="100" value="${Math.round(audio.getMusicVolume() * 100)}"></label><label class="dialog-setting"><span>MIDI 音色</span><select id="game-midi-tone"><option value="fm" ${audio.getTone() === 'fm' ? 'selected' : ''}>TinySynth FM</option><option value="chip" ${audio.getTone() === 'chip' ? 'selected' : ''}>TinySynth Chip</option></select></label><label class="dialog-setting"><span>混响</span><input id="game-reverb" type="range" min="0" max="100" value="${Math.round(audio.getReverbLevel() * 100)}"></label><label class="dialog-setting"><span>音效音量</span><input id="game-sound-volume" type="range" min="0" max="100" value="${Math.round(audio.getSoundVolume() * 100)}"></label></dialog><dialog id="game-help-dialog" class="game-dialog"><header><strong>游玩帮助</strong><button class="dialog-close icon-btn">×</button></header><div class="help-list"><p><kbd>WASD</kbd> / <kbd>方向键</kbd>：移动；按住连续移动。</p><p>手机方向键：按住连续移动。</p><p>鼠标/单指拖动地图；滚轮 / Pinch：缩放。</p><p><kbd>~</kbd>：DEBUG；点击格子查看详情。</p><p><kbd>Z</kbd> / <kbd>U</kbd>：撤销；<kbd>R</kbd>：重玩。</p></div></dialog></div>`;
}

function bindAudioControls(root: ParentNode, audio: TinySynthAudioBackend): void {
  root.querySelector<HTMLButtonElement>('#music')?.addEventListener('click', (event) => {
    audio.setEnabled(!audio.isEnabled());
    (event.currentTarget as HTMLButtonElement).textContent = audio.isEnabled() ? '♫' : '♪̸';
    const checkbox = root.querySelector<HTMLInputElement>('#game-music-enabled');
    if (checkbox) checkbox.checked = audio.isEnabled();
  });
  root.querySelector<HTMLInputElement>('#game-music-enabled')?.addEventListener('change', (event) => {
    audio.setEnabled((event.currentTarget as HTMLInputElement).checked);
    const button = root.querySelector<HTMLButtonElement>('#music');
    if (button) button.textContent = audio.isEnabled() ? '♫' : '♪̸';
  });
  root.querySelector<HTMLInputElement>('#game-music-volume')?.addEventListener('input', (event) => audio.setMusicVolume(Number((event.currentTarget as HTMLInputElement).value) / 100));
  root.querySelector<HTMLInputElement>('#game-sound-volume')?.addEventListener('input', (event) => audio.setSoundVolume(Number((event.currentTarget as HTMLInputElement).value) / 100));
  root.querySelector<HTMLSelectElement>('#game-midi-tone')?.addEventListener('change', (event) => audio.setTone((event.currentTarget as HTMLSelectElement).value === 'chip' ? 'chip' : 'fm'));
  root.querySelector<HTMLInputElement>('#game-reverb')?.addEventListener('input', (event) => audio.setReverbLevel(Number((event.currentTarget as HTMLInputElement).value) / 100));
}

function bindDialogs(root: ParentNode): void {
  const info = root.querySelector<HTMLDialogElement>('#level-info-dialog');
  const settings = root.querySelector<HTMLDialogElement>('#game-settings-dialog');
  const help = root.querySelector<HTMLDialogElement>('#game-help-dialog');
  root.querySelector<HTMLButtonElement>('#level-info')?.addEventListener('click', () => info?.showModal());
  root.querySelector<HTMLButtonElement>('#game-settings')?.addEventListener('click', () => settings?.showModal());
  root.querySelector<HTMLButtonElement>('#game-help')?.addEventListener('click', () => help?.showModal());
  root.querySelectorAll<HTMLButtonElement>('.game-dialog .dialog-close').forEach((button) => button.addEventListener('click', () => button.closest<HTMLDialogElement>('dialog')?.close()));
  root.querySelectorAll<HTMLDialogElement>('.game-dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  }));
}

function requestBonusAccess(profile: PlayerProfile, overlay: HTMLDivElement, card: HTMLElement): Promise<boolean> {
  return new Promise((resolve) => {
    const canBuy = profile.bonusCoins >= 3;
    card.innerHTML = `<div class="result-kicker">BEAVER BONUS ROUND</div><h2>奖励关钥匙</h2><p>${canBuy ? `原版规则：没有 Super Key 时，可花 <strong>3 Bonus Coin</strong> 向 Beaver 购买本关的一次性钥匙。当前有 ${profile.bonusCoins} 个。` : `你没有足够的 Bonus Coin。原版 Beaver 还留了一个例外：<strong>Pretty please.</strong>`}</p><div class="result-actions"><button class="primary-btn" data-bonus-access="enter">${canBuy ? '花 3 Coin 进入' : 'Pretty please · 免费进入'}</button><button class="ghost-btn" data-bonus-access="back">返回选关</button></div>`;
    overlay.hidden = false;
    const handler = (event: Event): void => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-bonus-access]');
      if (!button) return;
      overlay.removeEventListener('click', handler);
      overlay.hidden = true;
      if (button.dataset.bonusAccess === 'enter') {
        if (canBuy) {
          profile.bonusCoins -= 3;
          saveProfile(profile);
        }
        resolve(true);
      } else {
        resolve(false);
      }
    };
    overlay.addEventListener('click', handler);
  });
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Game UI failed to mount: ${selector}`);
  return element;
}
