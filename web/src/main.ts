import {
  Game,
  InputController,
  ObjectId,
  fetchJson,
  type CatalogLevel,
  type LevelCatalog,
  type LevelData,
  type TileInspection
} from '@bobby/engine';
import {
  BobbyEditor,
  createBlankLevel,
  decodeShareLevel,
  fromLevelData,
  shareValueFromHash,
  toLevelData,
  type EditorLevel
} from '@bobby/editor';
import { TinySynthAudioBackend } from './TinySynthAudio.js';

const rootElement = document.querySelector<HTMLDivElement>('#app');
if (!rootElement) throw new Error('#app not found');
const app: HTMLDivElement = rootElement;
const siteUrl = (path: string): string => new URL(path.replace(/^\/+/, ''), document.baseURI).href;

const catalog = await fetchJson<LevelCatalog>(siteUrl('assets/catalog.json'));
const audio = new TinySynthAudioBackend();
let activeGame: Game | null = null;
let activeInput: InputController | null = null;
let activeEditor: BobbyEditor | null = null;
let activeUiTimer: number | null = null;
let selectedReleaseId = preferredRelease();

interface PlayerProfile {
  bonusCoins: number;
  goldenCarrots: number;
  superKey: boolean;
  speedShoes: boolean;
  rewards: Record<string, { bonusCoins: number; goldenCarrots: number }>;
}

function loadProfile(): PlayerProfile {
  try {
    const raw = JSON.parse(localStorage.getItem('bobby.profile') ?? '{}') as Partial<PlayerProfile>;
    return {
      bonusCoins: Number(raw.bonusCoins ?? 0),
      goldenCarrots: Number(raw.goldenCarrots ?? 0),
      superKey: raw.superKey === true,
      speedShoes: raw.speedShoes === true,
      rewards: raw.rewards && typeof raw.rewards === 'object' ? raw.rewards : {}
    };
  } catch {
    return { bonusCoins: 0, goldenCarrots: 0, superKey: false, speedShoes: false, rewards: {} };
  }
}

function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem('bobby.profile', JSON.stringify(profile));
}

function bankLevelRewards(canonicalId: string, bonusCoins: number, goldenCarrots: number): PlayerProfile {
  const profile = loadProfile();
  const previous = profile.rewards[canonicalId] ?? { bonusCoins: 0, goldenCarrots: 0 };
  const next = {
    bonusCoins: Math.max(previous.bonusCoins, bonusCoins),
    goldenCarrots: Math.max(previous.goldenCarrots, goldenCarrots)
  };
  profile.bonusCoins += next.bonusCoins - previous.bonusCoins;
  profile.goldenCarrots += next.goldenCarrots - previous.goldenCarrots;
  profile.rewards[canonicalId] = next;
  saveProfile(profile);
  return profile;
}

document.addEventListener('pointerdown', () => audio.resume(), { passive: true });
document.addEventListener('keydown', () => audio.resume());

function completedLevels(): Set<string> {
  try {
    const value = JSON.parse(localStorage.getItem('bobby.completedLevels') ?? '[]');
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}

function markLevelCompleted(canonicalId: string): void {
  const completed = completedLevels();
  completed.add(canonicalId);
  localStorage.setItem('bobby.completedLevels', JSON.stringify([...completed].sort()));
}

function lastLevel(): CatalogLevel {
  const stored = localStorage.getItem('bobby.lastLevel');
  if (stored) {
    const found = catalog.levels.find((level) => level.publicId === stored || level.id === stored);
    if (found) return found;
  }
  return catalog.levels[0]!;
}

function preferredRelease(): string {
  const saved = localStorage.getItem('bobby.selectedRelease');
  if (saved && catalog.releases.some((release) => release.id === saved)) return saved;
  const stored = localStorage.getItem('bobby.lastLevel');
  const fromLast = catalog.levels.find((level) => level.publicId === stored || level.id === stored)?.release;
  return fromLast ?? 'base';
}

function randomLevel(): CatalogLevel {
  return catalog.levels[Math.floor(Math.random() * catalog.levels.length)] ?? catalog.levels[0]!;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' })[char] ?? char);
}

function navigate(path: string): void {
  const target = new URL(path.replace(/^\/+/, ''), document.baseURI);
  history.pushState(null, '', `${target.pathname}${target.search}${target.hash}`);
  void renderRoute();
}

function shell(content: string): string {
  return `<div class="shell">
    <nav class="topbar">
      <a class="brand" href="" data-nav>Bobby Carrot</a>
      <div class="spacer"></div>
      <a class="nav-link desktop" href="levels" data-nav>选择关卡</a>
      <a class="nav-link desktop" href="edit" data-nav>地图编辑器</a>
      <a class="nav-link desktop" href="settings" data-nav>设置</a>
    </nav>
    <main class="content">${content}</main>
  </div>`;
}

function renderHome(): void {
  const last = lastLevel();
  audio.playMusic('title');
  app.innerHTML = shell(`
    <section class="hero">
      <div>
        <div class="muted">BOBBY CARROT 5 · WEB REMASTER</div>
        <h1>Bobby<br>Carrot</h1>
        <p>保留第五代 Base + UP1～UP9 的原版高清美术、关卡结构和谜题机制，用现代浏览器重新实现 Camera、动画、键盘与手机操作。</p>
        <div class="actions">
          <a class="primary-btn" href="play/${last.publicId}" data-nav>继续游玩 · ${displayLevelId(last)}</a>
          <a class="ghost-btn" href="levels" data-nav>选择关卡</a>
          <a class="ghost-btn" href="edit" data-nav>创建地图</a>
          <button id="home-random" class="ghost-btn">随机一关</button>
        </div>
      </div>
      <img class="hero-art" src="assets/art/hd/title.png" alt="Bobby Carrot 5 original title art" />
    </section>
    <section class="stat-row">
      <div class="stat"><strong>10</strong><span>正式发行包</span></div>
      <div class="stat"><strong>${catalog.uniqueLevels}</strong><span>唯一关卡</span></div>
      <div class="stat"><strong>${completedLevels().size}</strong><span>已完成</span></div>
    </section>
  `);
  bindNavigation();
  document.querySelector<HTMLButtonElement>('#home-random')?.addEventListener('click', () => navigate(`/play/${randomLevel().publicId}`));
}

function renderLevels(): void {
  audio.playMusic('title');
  const last = lastLevel();
  const release = catalog.releases.find((item) => item.id === selectedReleaseId) ?? catalog.releases[0]!;
  selectedReleaseId = release.id;
  localStorage.setItem('bobby.selectedRelease', selectedReleaseId);
  const chapters = catalog.chapters.filter((chapter) => chapter.release === release.id).sort((a, b) => a.chapter - b.chapter);
  const completed = completedLevels();

  app.innerHTML = shell(`
    <section class="level-browser-head">
      <div class="section-title"><div><h1>选择关卡</h1><p>按原版发行包 → 章节 → 关卡浏览。内部 001～485 编号不再作为玩家界面。</p></div></div>
      <div class="level-browser-actions">
        <a class="primary-btn" href="play/${last.publicId}" data-nav>继续 · ${displayLevelId(last)}</a>
        <button id="random-level" class="ghost-btn">随机一个关卡</button>
      </div>
    </section>
    <div class="release-tabs" role="tablist" aria-label="Bobby Carrot 5 发行包">
      ${catalog.releases.map((item) => `<button class="release-tab ${item.id === release.id ? 'active' : ''}" data-release="${item.id}">
        <strong>${item.id === 'base' ? 'BASE' : item.id.toUpperCase()}</strong>
        <span>${escapeHtml(item.中文名 || item.label)}</span><small>${item.levelCount} 关</small>
      </button>`).join('')}
    </div>
    <section class="release-summary">
      <div><span class="eyebrow">${release.id === 'base' ? 'BASE / FOREVER' : release.id.toUpperCase()}</span><h2>${escapeHtml(release.中文名 || release.label)}</h2></div>
      <div class="muted">${chapters.length} 个章节 · ${release.levelCount} 关</div>
    </section>
    <div class="chapter-list">${chapters.map((chapter) => renderChapter(chapter.id, completed)).join('')}</div>
    <div class="difficulty-legend muted">
      <span><i class="difficulty-dot easy"></i>简单</span><span><i class="difficulty-dot medium"></i>中等</span><span><i class="difficulty-dot hard"></i>困难</span>
      <span>带“≈”的是根据 A～F 历史难度合集估算；无“≈”为历史难度资料直接映射。</span>
    </div>
  `);
  bindNavigation();
  document.querySelectorAll<HTMLButtonElement>('button[data-release]').forEach((button) => {
    button.addEventListener('click', () => { selectedReleaseId = button.dataset.release ?? 'base'; renderLevels(); });
  });
  document.querySelector<HTMLButtonElement>('#random-level')?.addEventListener('click', () => navigate(`/play/${randomLevel().publicId}`));
}

function renderChapter(chapterId: string, completed: Set<string>): string {
  const chapter = catalog.chapters.find((item) => item.id === chapterId);
  if (!chapter) return '';
  const levels = chapter.levelPublicIds
    .map((publicId) => catalog.levels.find((level) => level.publicId === publicId))
    .filter((level): level is CatalogLevel => Boolean(level));
  return `<section class="chapter-card">
    <header class="chapter-head"><div><div class="chapter-number">${chapter.chapter === 0 ? 'TUTORIAL' : `CHAPTER ${chapter.chapter}`}</div><h3>${escapeHtml(chapter.title)}</h3></div><span class="muted">${levels.length} 关</span></header>
    <div class="chapter-levels">
      ${levels.map((level) => {
        const done = completed.has(level.canonicalId);
        return `<a class="chapter-level ${done ? 'completed' : ''}" href="play/${level.publicId}" data-nav title="${escapeHtml(level.publicId)} · ${escapeHtml(level.difficulty.label)}">
          <span class="chapter-level-no">${level.chapterLevel}</span>
          <span class="difficulty-badge ${level.difficulty.level} ${level.difficulty.source}">${escapeHtml(level.difficulty.label)}</span>
          ${done ? '<span class="done-mark" title="已通关">✓</span>' : ''}
        </a>`;
      }).join('')}
    </div>
  </section>`;
}

async function renderGame(levelIdRaw: string): Promise<void> {
  const decoded = decodeURIComponent(levelIdRaw).toLowerCase();
  const meta = catalog.levels.find((level) => level.publicId === decoded || level.id === decoded.padStart(3, '0'));
  if (!meta) { navigate('/levels'); return; }

  localStorage.setItem('bobby.lastLevel', meta.publicId);
  localStorage.setItem('bobby.selectedRelease', meta.release);
  selectedReleaseId = meta.release;

  app.innerHTML = `<div class="game-page">
    <header class="game-toolbar game-toolbar-v2">
      <div class="game-toolbar-left">
        <button id="back" class="icon-btn" title="选择关卡" aria-label="选择关卡">←</button>
        <span class="level-label">${displayLevelId(meta)}</span>
        <span class="difficulty-badge ${meta.difficulty.level} ${meta.difficulty.source}">${escapeHtml(meta.difficulty.label)}</span>
        <button id="level-info" class="icon-btn" title="关卡信息" aria-label="关卡信息">ⓘ</button>
      </div>
      <div class="game-hud" aria-label="游戏状态">
        <span class="hud-chip" title="本次游玩时间"><strong id="hud-time">00:00</strong></span>
        <span class="hud-chip" title="剩余主要目标"><span id="hud-objective-icon" class="hud-art hud-carrot" aria-hidden="true"></span><strong id="hud-objectives">—</strong></span>
        <span id="hud-items" class="hud-items" aria-label="已取得物品"></span>
      </div>
      <div class="game-toolbar-right">
        <span class="hud-chip step-chip" title="移动步数"><strong id="hud-moves">0</strong><span class="hud-text-label">STEPS</span></span>
        <button id="undo" class="icon-btn" title="撤销上一步" aria-label="撤销上一步">↶</button>
        <button id="restart" class="icon-btn" title="重新开始本关" aria-label="重新开始本关">↻</button>
        <button id="music" class="icon-btn" title="音乐开关" aria-label="音乐开关">${audio.isEnabled() ? '♫' : '♪̸'}</button>
        <button id="edit-level" class="icon-btn" title="在编辑器中打开" aria-label="编辑器">✎</button>
        <button id="game-settings" class="icon-btn" title="设置" aria-label="设置">⚙</button>
        <button id="game-help" class="icon-btn" title="游玩帮助" aria-label="游玩帮助">?</button>
      </div>
    </header>
    <main class="game-stage">
      <canvas id="game"></canvas>
      <div class="mobile-dpad" aria-label="移动方向">
        <button data-move="up" aria-label="向上">↑</button><button data-move="left" aria-label="向左">←</button>
        <button data-move="down" aria-label="向下">↓</button><button data-move="right" aria-label="向右">→</button>
      </div>
      <aside id="debug-panel" class="debug-panel" aria-live="polite"></aside>
      <div id="status" class="game-status">正在载入关卡…</div>
      <div id="game-result" class="game-result" hidden><section class="result-card" role="dialog" aria-modal="true" aria-live="polite"></section></div>
    </main>
    <dialog id="level-info-dialog" class="game-dialog">
      <header><strong>关卡信息</strong><button class="dialog-close icon-btn" title="关闭">×</button></header>
      <dl class="info-grid">
        <dt>关卡</dt><dd>${displayLevelId(meta)}</dd>
        <dt>章节</dt><dd>${escapeHtml(meta.chapterTitle)}</dd>
        <dt>难度</dt><dd>${escapeHtml(meta.difficulty.label)}</dd>
        <dt>地图</dt><dd>${meta.width} × ${meta.height}</dd>
      </dl>
      ${meta.chapterDescription ? `<p class="muted">${escapeHtml(meta.chapterDescription)}</p>` : ''}
    </dialog>
    <dialog id="game-settings-dialog" class="game-dialog">
      <header><strong>设置</strong><button class="dialog-close icon-btn" title="关闭">×</button></header>
      <label class="dialog-setting"><span>音乐</span><input id="game-music-enabled" type="checkbox" ${audio.isEnabled() ? 'checked' : ''}></label>
      <label class="dialog-setting"><span>音乐音量</span><input id="game-music-volume" type="range" min="0" max="100" value="${Math.round(audio.getMusicVolume() * 100)}"></label>
      <label class="dialog-setting"><span>MIDI 音色</span><select id="game-midi-tone"><option value="fm" ${audio.getTone() === 'fm' ? 'selected' : ''}>TinySynth FM</option><option value="chip" ${audio.getTone() === 'chip' ? 'selected' : ''}>TinySynth Chip</option></select></label>
      <label class="dialog-setting"><span>混响</span><input id="game-reverb" type="range" min="0" max="100" value="${Math.round(audio.getReverbLevel() * 100)}"></label>
      <label class="dialog-setting"><span>音效音量</span><input id="game-sound-volume" type="range" min="0" max="100" value="${Math.round(audio.getSoundVolume() * 100)}"></label>
    </dialog>
    <dialog id="game-help-dialog" class="game-dialog">
      <header><strong>游玩帮助</strong><button class="dialog-close icon-btn" title="关闭">×</button></header>
      <div class="help-list">
        <p><kbd>WASD</kbd> / <kbd>方向键</kbd>：移动；按住连续移动，抬起后当前格结束即停。</p>
        <p>手机方向键：按住连续移动；抬起后当前格结束即停。</p>
        <p>鼠标/单指拖动地图；鼠标滚轮 / 双指 Pinch：放大缩小。</p>
        <p><kbd>~</kbd>：DEBUG。开启后地图只显示格线，点击格子后右侧显示详情。</p>
        <p><kbd>Z</kbd> / <kbd>U</kbd>：撤销；<kbd>R</kbd>：重玩。</p>
      </div>
    </dialog>
  </div>`;

  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  const status = document.querySelector<HTMLDivElement>('#status');
  const debugPanel = document.querySelector<HTMLElement>('#debug-panel');
  const gameResult = document.querySelector<HTMLDivElement>('#game-result');
  const resultCard = gameResult?.querySelector<HTMLElement>('.result-card');
  const hudTime = document.querySelector<HTMLElement>('#hud-time');
  const hudObjectives = document.querySelector<HTMLElement>('#hud-objectives');
  const hudObjectiveIcon = document.querySelector<HTMLElement>('#hud-objective-icon');
  const hudMoves = document.querySelector<HTMLElement>('#hud-moves');
  const hudItems = document.querySelector<HTMLElement>('#hud-items');
  if (!canvas || !status || !debugPanel || !gameResult || !resultCard || !hudTime || !hudObjectives || !hudObjectiveIcon || !hudMoves || !hudItems) throw new Error('Game UI failed to mount');

  const level = await fetchJson<LevelData>(siteUrl(`assets/${meta.path}`));
  const profile = loadProfile();
  const isBonus = meta.chapterLevel > 10;
  const hasLock = level.objects.some((object) => object.type === ObjectId.LOCK);
  let temporaryKey = false;

  if (isBonus && hasLock && !profile.superKey) {
    const access = await requestBonusAccess(profile, gameResult, resultCard);
    if (!access) { navigate('/levels'); return; }
    temporaryKey = true;
  }

  activeGame = new Game({
    canvas,
    audio,
    profile: { superKey: profile.superKey, temporaryKey, speedShoes: profile.speedShoes },
    assets: {
      atlasUrl: 'assets/art/hd/ts.png', animationAtlasUrl: 'assets/art/hd/ta.png',
      bobbyUrls: { left:'assets/art/hd/b0.png', right:'assets/art/hd/b1.png', up:'assets/art/hd/b2.png', down:'assets/art/hd/b3.png' },
      mowerBobbyUrl: 'assets/art/hd/b7.png', idleBobbyUrl: 'assets/art/hd/b4.png', deathBobbyUrl: 'assets/art/hd/b5.png',
      kiteUrl: 'assets/art/hd/b9.png', sourceTileSize: 48
    }
  });
  activeInput = new InputController(activeGame);
  bindMobileControls(activeGame);
  await activeGame.loadLevel(level);
  audio.playMusic(isBonus ? 'bonus' : `ingame${meta.number % 3}`);

  let levelStartedAt = performance.now();
  let debugInspection: string | null = null;
  let visibleResult: 'death' | 'complete' | null = null;
  const closeResult = (): void => { visibleResult = null; gameResult.hidden = true; };
  const renderResult = (): void => {
    if (!activeGame?.hasLevel || activeGame.isAnimating) return;
    const world = activeGame.world;
    const kind = world.dead ? 'death' : world.completed ? 'complete' : null;
    if (!kind) { closeResult(); return; }
    if (visibleResult === kind) return;
    visibleResult = kind;

    if (kind === 'complete') {
      markLevelCompleted(meta.canonicalId);
      bankLevelRewards(meta.canonicalId, world.state.bonusCoinsInLevel, world.state.goldenCarrotsInLevel);
      const index = catalog.levels.findIndex((entry) => entry.canonicalId === meta.canonicalId);
      const next = catalog.levels[index + 1];
      resultCard.innerHTML = `
        <div class="result-kicker">${displayLevelId(meta)}</div><h2>关卡完成</h2>
        <p>移动 ${world.state.moves} 步 · 用时 ${formatElapsed(performance.now() - levelStartedAt)} · 金胡萝卜 ${world.state.goldenCarrotsInLevel}</p>
        <div class="result-actions">
          ${next ? `<button class="primary-btn" data-result="next" data-next="${next.publicId}">下一关 · ${displayLevelId(next)}</button>` : ''}
          <button class="ghost-btn" data-result="replay">重玩</button><button class="ghost-btn" data-result="levels">关卡列表</button>
        </div>`;
    } else {
      resultCard.innerHTML = `
        <div class="result-kicker danger">BOBBY FAILED</div><h2>失败</h2><p>${escapeHtml(world.state.deathReason ?? 'Bobby 没能继续前进。')}</p>
        <div class="result-actions">${activeGame.canUndo ? '<button class="primary-btn" data-result="undo">撤销这一步</button>' : ''}<button class="ghost-btn" data-result="retry">重新开始</button><button class="ghost-btn" data-result="levels">关卡列表</button></div>`;
    }
    gameResult.hidden = false;
  };

  const renderHud = (): void => {
    if (!activeGame?.hasLevel) return;
    const world = activeGame.world;
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
    if (!activeGame?.hasLevel) return;
    renderHud();
    debugPanel.classList.toggle('visible', activeGame.debug);
    debugPanel.textContent = activeGame.debug ? (debugInspection ?? 'DEBUG\n点击地图格查看详情') : '';
    status.classList.remove('debug');
    const move = activeGame.lastMove;
    status.textContent = move ? `${move.moved ? '移动' : '阻挡'} · ${move.passage.reason}` : `${displayLevelId(meta)} · 准备就绪`;
    renderResult();
  };
  activeGame.on('change', update);
  activeGame.on('debug-change', () => { if (!activeGame?.debug) debugInspection = null; update(); });
  update();
  activeUiTimer = window.setInterval(renderHud, 250);

  const askUndo = (): void => {
    if (!activeGame?.canUndo) return;
    if (window.confirm('撤销上一步？')) { activeGame.undo(); closeResult(); }
  };
  const askRestart = (): void => {
    if (!activeGame) return;
    if (window.confirm('重新开始本关？当前进度会丢失。')) {
      activeGame.restart();
      levelStartedAt = performance.now();
      debugInspection = null;
      closeResult();
      update();
    }
  };

  gameResult.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-result]');
    if (!button || !activeGame) return;
    const action = button.dataset.result;
    if (action === 'undo') askUndo();
    else if (action === 'retry' || action === 'replay') askRestart();
    else if (action === 'levels') navigate('/levels');
    else if (action === 'next' && button.dataset.next) navigate(`/play/${button.dataset.next}`);
  });

  document.querySelector<HTMLButtonElement>('#back')?.addEventListener('click', () => navigate('/levels'));
  document.querySelector<HTMLButtonElement>('#edit-level')?.addEventListener('click', () => navigate(`/edit/${meta.publicId}`));
  document.querySelector<HTMLButtonElement>('#undo')?.addEventListener('click', askUndo);
  document.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', askRestart);
  document.querySelector<HTMLButtonElement>('#music')?.addEventListener('click', (event) => {
    audio.setEnabled(!audio.isEnabled());
    (event.currentTarget as HTMLButtonElement).textContent = audio.isEnabled() ? '♫' : '♪̸';
    const checkbox = document.querySelector<HTMLInputElement>('#game-music-enabled');
    if (checkbox) checkbox.checked = audio.isEnabled();
  });

  const infoDialog = document.querySelector<HTMLDialogElement>('#level-info-dialog');
  const settingsDialog = document.querySelector<HTMLDialogElement>('#game-settings-dialog');
  const helpDialog = document.querySelector<HTMLDialogElement>('#game-help-dialog');
  document.querySelector<HTMLButtonElement>('#level-info')?.addEventListener('click', () => infoDialog?.showModal());
  document.querySelector<HTMLButtonElement>('#game-settings')?.addEventListener('click', () => settingsDialog?.showModal());
  document.querySelector<HTMLButtonElement>('#game-help')?.addEventListener('click', () => helpDialog?.showModal());
  document.querySelectorAll<HTMLButtonElement>('.game-dialog .dialog-close').forEach((button) => button.addEventListener('click', () => button.closest<HTMLDialogElement>('dialog')?.close()));
  document.querySelectorAll<HTMLDialogElement>('.game-dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));

  document.querySelector<HTMLInputElement>('#game-music-enabled')?.addEventListener('change', (event) => {
    audio.setEnabled((event.currentTarget as HTMLInputElement).checked);
    const button = document.querySelector<HTMLButtonElement>('#music');
    if (button) button.textContent = audio.isEnabled() ? '♫' : '♪̸';
  });
  document.querySelector<HTMLInputElement>('#game-music-volume')?.addEventListener('input', (event) => audio.setMusicVolume(Number((event.currentTarget as HTMLInputElement).value) / 100));
  document.querySelector<HTMLInputElement>('#game-sound-volume')?.addEventListener('input', (event) => audio.setSoundVolume(Number((event.currentTarget as HTMLInputElement).value) / 100));
  document.querySelector<HTMLSelectElement>('#game-midi-tone')?.addEventListener('change', (event) => audio.setTone((event.currentTarget as HTMLSelectElement).value === 'chip' ? 'chip' : 'fm'));
  document.querySelector<HTMLInputElement>('#game-reverb')?.addEventListener('input', (event) => audio.setReverbLevel(Number((event.currentTarget as HTMLInputElement).value) / 100));

  canvas.addEventListener('click', (event) => {
    if (!activeGame?.debug || activeInput?.consumePointerClickSuppression()) return;
    const tile: TileInspection | null = activeGame.inspectCanvasPoint(event.clientX, event.clientY);
    debugInspection = tile ? formatTileInspection(tile, activeGame) : 'DEBUG\n地图外';
    update();
  });
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTileInspection(tile: TileInspection, game: Game): string {
  const world = game.world;
  const dynamic = tile.dynamicEntity;
  return [
    `Tile (${tile.x}, ${tile.y})`,
    `Terrain: ${tile.terrainType}`,
    `Object: ${tile.object ? tile.objectType : 'empty'}`,
    dynamic ? `Dynamic: ${dynamic.type}` : 'Dynamic: none',
    dynamic ? `  direction: ${dynamic.direction ?? 'none'}` : '',
    dynamic ? `  rider: ${dynamic.rider} · settled: ${dynamic.settled}` : '',
    dynamic ? `  offsetPx: ${dynamic.offsetXpx}, ${dynamic.offsetYpx}` : '',
    `Flags: player=${tile.isPlayer} · start=${tile.isStart}`,
    '',
    `Bobby: (${world.player.x}, ${world.player.y}) · facing=${world.facing}`,
    `Forced: ${world.forcedKind ?? 'none'} / ${world.forcedDirection ?? 'none'}`,
    `Mower: ${world.ridingMower}`,
    `Objectives: ${world.objectiveRemaining}/${world.objectiveTotal}`,
    `Moves: ${world.state.moves}`,
    `Inventory: gas=${world.state.inventory.gas} kite=${world.state.inventory.kite} shovel=${world.state.inventory.shovel} beans=${world.state.inventory.beans}`,
    game.lastMove ? `Last passage: ${game.lastMove.passage.reason} [${game.lastMove.passage.confidence}]` : 'Last passage: none'
  ].filter(Boolean).join('\n');
}

function bindMobileControls(game: Game): void {
  document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
    const direction = button.dataset.move as 'up' | 'down' | 'left' | 'right';
    const press = (event: PointerEvent): void => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      game.setHeldDirection(direction);
    };
    const release = (event: PointerEvent): void => {
      event.preventDefault();
      game.setHeldDirection(null);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', () => game.setHeldDirection(null));
  });
}

async function renderEditorRoute(levelIdRaw?: string): Promise<void> {
  audio.stopMusic();
  let level: EditorLevel;
  const shared = shareValueFromHash(location.hash);
  if (shared) {
    try { level = await decodeShareLevel(shared); }
    catch (error) {
      app.innerHTML = shell(`<section class="settings-card"><h2>分享地图无法打开</h2><p class="muted">${escapeHtml(error instanceof Error ? error.message : String(error))}</p><a class="primary-btn" href="edit" data-nav>新建地图</a></section>`);
      bindNavigation(); return;
    }
  } else if (levelIdRaw) {
    const decoded = decodeURIComponent(levelIdRaw).toLowerCase();
    const meta = catalog.levels.find((entry) => entry.publicId === decoded || entry.id === decoded.padStart(3, '0'));
    if (!meta) { navigate('/edit'); return; }
    const official = await fetchJson<LevelData>(`assets/${meta.path}`);
    level = fromLevelData(official);
    level.name = `${meta.publicId.toUpperCase()} · Copy`;
  } else level = createBlankLevel(16, 16);

  app.innerHTML = '<div id="editor-mount"></div>';
  const root = document.querySelector<HTMLElement>('#editor-mount');
  if (!root) throw new Error('Editor mount failed');
  activeEditor = new BobbyEditor({
    root, level, atlasUrl: 'assets/art/hd/ts.png', animationAtlasUrl: 'assets/art/hd/ta.png',
    bobbyUrls: { left:'assets/art/hd/b0.png', right:'assets/art/hd/b1.png', up:'assets/art/hd/b2.png', down:'assets/art/hd/b3.png' },
    mowerBobbyUrl: 'assets/art/hd/b7.png', kiteUrl: 'assets/art/hd/b9.png', audio,
    shareOrigin: new URL('.', document.baseURI).href.replace(/\/$/, ''), onClose: () => navigate('/levels')
  });
}

async function renderSharedGame(): Promise<void> {
  const encoded = shareValueFromHash(location.hash);
  if (!encoded) { navigate('/edit'); return; }
  let editorLevel: EditorLevel;
  try { editorLevel = await decodeShareLevel(encoded); }
  catch (error) {
    app.innerHTML = shell(`<section class="settings-card"><h2>分享地图无法打开</h2><p class="muted">${escapeHtml(error instanceof Error ? error.message : String(error))}</p><a class="primary-btn" href="edit" data-nav>打开编辑器</a></section>`);
    bindNavigation(); return;
  }
  const level = toLevelData(editorLevel);
  audio.playMusic('ingame0');
  app.innerHTML = `<div class="game-page">
    <header class="game-toolbar"><button id="back" class="ghost-btn">← 首页</button><span class="level-label">${escapeHtml(editorLevel.name)}</span><span class="muted hide-mobile">Custom JSON · ${editorLevel.width}×${editorLevel.height}</span><div class="spacer"></div><button id="edit-level" class="icon-btn">Edit</button><button id="undo" class="icon-btn">Undo</button><button id="restart" class="icon-btn">Restart</button></header>
    <main class="game-stage"><canvas id="game"></canvas><div class="mobile-dpad" aria-label="移动方向"><button data-move="up" aria-label="向上">↑</button><button data-move="left" aria-label="向左">←</button><button data-move="down" aria-label="向下">↓</button><button data-move="right" aria-label="向右">→</button></div><div id="status" class="game-status">正在载入分享地图…</div><div id="game-result" class="game-result" hidden><section class="result-card"></section></div></main>
  </div>`;
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  const status = document.querySelector<HTMLDivElement>('#status');
  const result = document.querySelector<HTMLDivElement>('#game-result');
  const resultCard = result?.querySelector<HTMLElement>('.result-card');
  if (!canvas || !status || !result || !resultCard) throw new Error('Shared game UI failed to mount');

  activeGame = new Game({ canvas, audio, assets: {
    atlasUrl:'assets/art/hd/ts.png', animationAtlasUrl:'assets/art/hd/ta.png',
    bobbyUrls:{ left:'assets/art/hd/b0.png', right:'assets/art/hd/b1.png', up:'assets/art/hd/b2.png', down:'assets/art/hd/b3.png' },
    mowerBobbyUrl:'assets/art/hd/b7.png', idleBobbyUrl:'assets/art/hd/b4.png', deathBobbyUrl:'assets/art/hd/b5.png', kiteUrl:'assets/art/hd/b9.png', sourceTileSize:48
  }});
  activeInput = new InputController(activeGame);
  bindMobileControls(activeGame);
  await activeGame.loadLevel(level);

  const update = (): void => {
    if (!activeGame?.hasLevel) return;
    const world = activeGame.world;
    status.textContent = `Custom · Bobby ${world.player.x},${world.player.y} · 剩余目标 ${world.objectiveRemaining} · ${world.state.moves} 步`;
    if ((world.dead || world.completed) && activeGame && !activeGame.isAnimating) {
      resultCard.innerHTML = world.completed
        ? `<div class="result-kicker">CUSTOM LEVEL</div><h2>关卡完成</h2><div class="result-actions"><button class="primary-btn" data-shared="edit">编辑这个地图</button><button class="ghost-btn" data-shared="replay">重玩</button></div>`
        : `<div class="result-kicker danger">BOBBY FAILED</div><h2>失败</h2><p>${escapeHtml(world.state.deathReason ?? '')}</p><div class="result-actions"><button class="primary-btn" data-shared="edit">编辑这个地图</button><button class="ghost-btn" data-shared="replay">重试</button></div>`;
      result.hidden = false;
    }
  };
  activeGame.on('change', update); update();
  document.querySelector<HTMLButtonElement>('#back')?.addEventListener('click', () => navigate('/'));
  document.querySelector<HTMLButtonElement>('#edit-level')?.addEventListener('click', () => navigate(`/edit${location.hash}`));
  document.querySelector<HTMLButtonElement>('#undo')?.addEventListener('click', () => { if (window.confirm('撤销上一步？')) activeGame?.undo(); });
  document.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', () => { if (window.confirm('重新开始？')) { activeGame?.restart(); result.hidden = true; } });
  result.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-shared]');
    if (!button) return;
    if (button.dataset.shared === 'edit') navigate(`/edit${location.hash}`);
    else if (window.confirm('重新开始？')) { activeGame?.restart(); result.hidden = true; }
  });
}

function renderSettings(): void {
  audio.playMusic('title');
  const profile = loadProfile();
  app.innerHTML = shell(`
    <div class="section-title"><h1>设置</h1><p>保留原始 MIDI；TinySynth 可切换两套算法音色。SoundFont 后端会作为独立实现接入。</p></div>
    <section class="profile-strip"><div><strong>${profile.bonusCoins}</strong><span>Bonus Coin</span></div><div><strong>${profile.goldenCarrots}</strong><span>Golden Carrot</span></div><div><strong>${profile.superKey ? '已获得' : '未获得'}</strong><span>Super Key</span></div></section>
    <section class="settings-card">
      <div class="setting"><div><strong>音乐</strong><div class="muted">WebAudio TinySynth 1.1.3 · 原始 .mid</div></div><label class="switch-label"><input id="music-enabled" type="checkbox" ${audio.isEnabled() ? 'checked' : ''}> 启用</label></div>
      <div class="setting"><div><strong>MIDI 音色</strong><div class="muted">FM 更接近 GM；Chip 更接近简单硬件合成</div></div><select id="midi-tone"><option value="fm" ${audio.getTone() === 'fm' ? 'selected' : ''}>TinySynth FM</option><option value="chip" ${audio.getTone() === 'chip' ? 'selected' : ''}>TinySynth Chip</option></select></div>
      <div class="setting"><div><strong>混响</strong><div class="muted">减少干硬/尖锐感</div></div><input id="midi-reverb" type="range" min="0" max="100" value="${Math.round(audio.getReverbLevel() * 100)}"></div>
      <div class="setting"><div><strong>音乐音量</strong><div class="muted">0–100%</div></div><input id="music-volume" type="range" min="0" max="100" value="${Math.round(audio.getMusicVolume() * 100)}"></div>
      <div class="setting"><div><strong>音效音量</strong><div class="muted">收集/机关反馈</div></div><input id="sound-volume" type="range" min="0" max="100" value="${Math.round(audio.getSoundVolume() * 100)}"></div>
      <div class="setting"><div><strong>SoundFont MIDI</strong><div class="muted">下一后端：SpessaSynth + 可再分发 SF2/SF3；不替换原 MIDI</div></div><span>Planned</span></div>
      <div class="setting"><div><strong>操作</strong><div class="muted">WASD / 方向键 / Drag / Wheel / Pinch / ~ DEBUG</div></div><span>Modern</span></div>
    </section>
  `);
  bindNavigation();
  document.querySelector<HTMLInputElement>('#music-enabled')?.addEventListener('change', (event) => audio.setEnabled((event.currentTarget as HTMLInputElement).checked));
  document.querySelector<HTMLInputElement>('#music-volume')?.addEventListener('input', (event) => audio.setMusicVolume(Number((event.currentTarget as HTMLInputElement).value) / 100));
  document.querySelector<HTMLInputElement>('#sound-volume')?.addEventListener('input', (event) => audio.setSoundVolume(Number((event.currentTarget as HTMLInputElement).value) / 100));
  document.querySelector<HTMLSelectElement>('#midi-tone')?.addEventListener('change', (event) => audio.setTone((event.currentTarget as HTMLSelectElement).value === 'chip' ? 'chip' : 'fm'));
  document.querySelector<HTMLInputElement>('#midi-reverb')?.addEventListener('input', (event) => audio.setReverbLevel(Number((event.currentTarget as HTMLInputElement).value) / 100));
}

function requestBonusAccess(profile: PlayerProfile, overlay: HTMLDivElement, card: HTMLElement): Promise<boolean> {
  return new Promise((resolve) => {
    const canBuy = profile.bonusCoins >= 3;
    card.innerHTML = `
      <div class="result-kicker">BEAVER BONUS ROUND</div><h2>奖励关钥匙</h2>
      <p>${canBuy ? `原版规则：没有 Super Key 时，可花 <strong>3 Bonus Coin</strong> 向 Beaver 购买本关的一次性钥匙。当前有 ${profile.bonusCoins} 个。` : `你没有足够的 Bonus Coin。原版 Beaver 还留了一个例外：<strong>Pretty please.</strong>`}</p>
      <div class="result-actions"><button class="primary-btn" data-bonus-access="enter">${canBuy ? '花 3 Coin 进入' : 'Pretty please · 免费进入'}</button><button class="ghost-btn" data-bonus-access="back">返回选关</button></div>`;
    overlay.hidden = false;
    const handler = (event: Event): void => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-bonus-access]');
      if (!button) return;
      overlay.removeEventListener('click', handler); overlay.hidden = true;
      if (button.dataset.bonusAccess === 'enter') {
        if (canBuy) { profile.bonusCoins -= 3; saveProfile(profile); }
        resolve(true);
      } else resolve(false);
    };
    overlay.addEventListener('click', handler);
  });
}

function displayLevelId(level: CatalogLevel): string { return level.publicId.toUpperCase(); }

function bindNavigation(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => { event.preventDefault(); navigate(anchor.getAttribute('href') ?? '/'); });
  });
}

async function renderRoute(): Promise<void> {
  if (activeUiTimer !== null) { window.clearInterval(activeUiTimer); activeUiTimer = null; }
  activeInput?.destroy(); activeInput = null;
  activeGame?.destroy(); activeGame = null;
  activeEditor?.destroy(); activeEditor = null;
  const basePath = new URL(document.baseURI).pathname.replace(/\/+$/, '');
  const localPath = basePath && basePath !== '/' && location.pathname.startsWith(basePath) ? location.pathname.slice(basePath.length) : location.pathname;
  const path = localPath.replace(/\/+$/, '') || '/';
  if (path === '/') renderHome();
  else if (path === '/levels') renderLevels();
  else if (path === '/settings') renderSettings();
  else if (path === '/edit') await renderEditorRoute();
  else if (path.startsWith('/edit/')) await renderEditorRoute(path.split('/').pop());
  else if (path === '/play' && shareValueFromHash(location.hash)) await renderSharedGame();
  else if (path.startsWith('/play/')) await renderGame(path.split('/').pop() ?? 'base-0-1');
  else navigate('/');
}

window.addEventListener('popstate', () => void renderRoute());
await renderRoute();
