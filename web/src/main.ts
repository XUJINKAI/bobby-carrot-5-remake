import {
  Game,
  InputController,
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

const catalog = await fetchJson<LevelCatalog>('/assets/catalog.json');
const audio = new TinySynthAudioBackend();
let activeGame: Game | null = null;
let activeInput: InputController | null = null;
let activeEditor: BobbyEditor | null = null;
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
  history.pushState(null, '', path);
  void renderRoute();
}

function shell(content: string): string {
  return `<div class="shell">
    <nav class="topbar">
      <a class="brand" href="/" data-nav>Bobby Carrot</a>
      <div class="spacer"></div>
      <a class="nav-link desktop" href="/levels" data-nav>选择关卡</a>
      <a class="nav-link desktop" href="/edit" data-nav>地图编辑器</a>
      <a class="nav-link desktop" href="/settings" data-nav>设置</a>
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
          <a class="primary-btn" href="/play/${last.publicId}" data-nav>继续游玩 · ${displayLevelId(last)}</a>
          <a class="ghost-btn" href="/levels" data-nav>选择关卡</a>
          <a class="ghost-btn" href="/edit" data-nav>创建地图</a>
          <button id="home-random" class="ghost-btn">随机一关</button>
        </div>
      </div>
      <img class="hero-art" src="/assets/art/hd/title.png" alt="Bobby Carrot 5 original title art" />
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
      <div class="section-title">
        <div><h1>选择关卡</h1><p>按原版发行包 → 章节 → 关卡浏览。内部 001～485 编号不再作为玩家界面。</p></div>
      </div>
      <div class="level-browser-actions">
        <a class="primary-btn" href="/play/${last.publicId}" data-nav>继续 · ${displayLevelId(last)}</a>
        <button id="random-level" class="ghost-btn">随机一个关卡</button>
      </div>
    </section>

    <div class="release-tabs" role="tablist" aria-label="Bobby Carrot 5 发行包">
      ${catalog.releases.map((item) => `<button class="release-tab ${item.id === release.id ? 'active' : ''}" data-release="${item.id}">
        <strong>${item.id === 'base' ? 'BASE' : item.id.toUpperCase()}</strong>
        <span>${escapeHtml(item.中文名 || item.label)}</span>
        <small>${item.levelCount} 关</small>
      </button>`).join('')}
    </div>

    <section class="release-summary">
      <div><span class="eyebrow">${release.id === 'base' ? 'BASE / FOREVER' : release.id.toUpperCase()}</span><h2>${escapeHtml(release.中文名 || release.label)}</h2></div>
      <div class="muted">${chapters.length} 个章节 · ${release.levelCount} 关</div>
    </section>

    <div class="chapter-list">
      ${chapters.map((chapter) => renderChapter(chapter.id, completed)).join('')}
    </div>

    <div class="difficulty-legend muted">
      <span><i class="difficulty-dot easy"></i>简单</span>
      <span><i class="difficulty-dot medium"></i>中等</span>
      <span><i class="difficulty-dot hard"></i>困难</span>
      <span>带“≈”的是根据 A～F 历史难度合集估算；无“≈”为历史难度资料直接映射。</span>
    </div>
  `);

  bindNavigation();
  document.querySelectorAll<HTMLButtonElement>('button[data-release]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedReleaseId = button.dataset.release ?? 'base';
      renderLevels();
    });
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
    <header class="chapter-head">
      <div>
        <div class="chapter-number">${chapter.chapter === 0 ? 'TUTORIAL' : `CHAPTER ${chapter.chapter}`}</div>
        <h3>${escapeHtml(chapter.title)}</h3>
      </div>
      <span class="muted">${levels.length} 关</span>
    </header>
    <div class="chapter-levels">
      ${levels.map((level) => {
        const done = completed.has(level.canonicalId);
        return `<a class="chapter-level ${done ? 'completed' : ''}" href="/play/${level.publicId}" data-nav title="${escapeHtml(level.publicId)} · ${escapeHtml(level.difficulty.label)}">
          <span class="chapter-level-no">${level.chapterLevel}</span>
          <span class="difficulty-badge ${level.difficulty.level} ${level.difficulty.source}">${escapeHtml(level.difficulty.label)}</span>
          ${done ? '<span class="done-mark">✓</span>' : ''}
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
    <header class="game-toolbar">
      <button id="back" class="ghost-btn">← 选关</button>
      <span class="level-label">${displayLevelId(meta)}</span>
      <span class="difficulty-badge ${meta.difficulty.level} ${meta.difficulty.source}">${escapeHtml(meta.difficulty.label)}</span>
      <span class="muted hide-mobile">${escapeHtml(meta.chapterTitle)} · ${meta.width}×${meta.height}</span>
      <div class="spacer"></div>
      <button id="edit-level" class="icon-btn">Edit</button>
      <button id="music" class="icon-btn">${audio.isEnabled() ? '♫' : '♪̸'}</button>
      <button id="undo" class="icon-btn">Undo</button>
      <button id="restart" class="icon-btn">Restart</button>
      <button id="zoom-out" class="icon-btn">−</button>
      <span id="zoom" class="muted">100%</span>
      <button id="zoom-in" class="icon-btn">+</button>
      <button id="debug" class="icon-btn">Debug</button>
    </header>
    <main class="game-stage">
      <canvas id="game"></canvas>
      <div id="status" class="game-status">Loading level…</div>
      <div class="touch-hint">Swipe to move · pinch to zoom</div>
      <pre id="debug-panel" class="debug-panel">Click a tile to inspect.</pre>
      <div id="game-result" class="game-result" hidden>
        <section class="result-card" role="dialog" aria-modal="true" aria-live="polite"></section>
      </div>
    </main>
  </div>`;

  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  const status = document.querySelector<HTMLDivElement>('#status');
  const zoom = document.querySelector<HTMLSpanElement>('#zoom');
  const debugPanel = document.querySelector<HTMLPreElement>('#debug-panel');
  const gameResult = document.querySelector<HTMLDivElement>('#game-result');
  const resultCard = gameResult?.querySelector<HTMLElement>('.result-card');
  if (!canvas || !status || !zoom || !debugPanel || !gameResult || !resultCard) throw new Error('Game UI failed to mount');

  activeInput?.destroy();
  activeGame?.destroy();
  const level = await fetchJson<LevelData>(`/assets/${meta.path}`);
  const profile = loadProfile();
  const isBonus = level.objects.some((object) => object.id === 0xe7 || object.id === 0xf7 || object.id === 0xf8);
  const hasLock = level.objects.some((object) => object.id === 0xcd);
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
      atlasUrl: '/assets/art/hd/ts.png',
      animationAtlasUrl: '/assets/art/hd/ta.png',
      bobbyUrls: {
        left: '/assets/art/hd/b0.png',
        right: '/assets/art/hd/b1.png',
        up: '/assets/art/hd/b2.png',
        down: '/assets/art/hd/b3.png'
      },
      mowerBobbyUrl: '/assets/art/hd/b7.png',
      kiteUrl: '/assets/art/hd/b9.png',
      sourceTileSize: 48
    }
  });
  activeInput = new InputController(activeGame);
  await activeGame.loadLevel(level);

  audio.playMusic(isBonus ? 'bonus' : `ingame${meta.number % 3}`);

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
        <div class="result-kicker">${displayLevelId(meta)}</div>
        <h2>关卡完成</h2>
        <p>移动 ${world.state.moves} 步 · 目标 ${world.objectiveTotal}/${world.objectiveTotal} · 金胡萝卜 ${world.state.goldenCarrotsInLevel}</p>
        <div class="result-actions">
          ${next ? `<button class="primary-btn" data-result="next" data-next="${next.publicId}">下一关 · ${displayLevelId(next)}</button>` : ''}
          <button class="ghost-btn" data-result="replay">重玩</button>
          <button class="ghost-btn" data-result="levels">关卡列表</button>
        </div>`;
    } else {
      resultCard.innerHTML = `
        <div class="result-kicker danger">BOBBY FAILED</div>
        <h2>失败</h2>
        <p>${escapeHtml(world.state.deathReason ?? 'Bobby 没能继续前进。')}</p>
        <div class="result-actions">
          ${activeGame.canUndo ? '<button class="primary-btn" data-result="undo">撤销这一步</button>' : ''}
          <button class="ghost-btn" data-result="retry">重新开始</button>
          <button class="ghost-btn" data-result="levels">关卡列表</button>
        </div>`;
    }
    gameResult.hidden = false;
  };

  const update = (): void => {
    if (!activeGame?.hasLevel) return;
    zoom.textContent = `${Math.round(activeGame.zoom * 100)}%`;
    const move = activeGame.lastMove;
    const objective = `${activeGame.world.objectiveTotal - activeGame.world.objectiveRemaining}/${activeGame.world.objectiveTotal}`;
    const time = activeGame.world.state.bonusTimeRemainingMs === null ? '' : ` · ⏱ ${Math.ceil(activeGame.world.state.bonusTimeRemainingMs / 1000)}s`;
    status.textContent = move
      ? `${move.moved ? '移动' : '阻挡'} · ${move.passage.reason} · 目标 ${objective}${time}`
      : `${displayLevelId(meta)} · 目标 ${objective}${time}`;
    renderResult();
  };
  activeGame.on('change', update);
  update();

  gameResult.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-result]');
    if (!button || !activeGame) return;
    const action = button.dataset.result;
    if (action === 'undo') { activeGame.undo(); closeResult(); }
    else if (action === 'retry' || action === 'replay') { activeGame.restart(); closeResult(); }
    else if (action === 'levels') navigate('/levels');
    else if (action === 'next' && button.dataset.next) navigate(`/play/${button.dataset.next}`);
  });

  document.querySelector<HTMLButtonElement>('#back')?.addEventListener('click', () => navigate('/levels'));
  document.querySelector<HTMLButtonElement>('#edit-level')?.addEventListener('click', () => navigate(`/edit/${meta.publicId}`));
  document.querySelector<HTMLButtonElement>('#undo')?.addEventListener('click', () => activeGame?.undo());
  document.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', () => activeGame?.restart());
  document.querySelector<HTMLButtonElement>('#zoom-in')?.addEventListener('click', () => activeGame?.zoomBy(1.1));
  document.querySelector<HTMLButtonElement>('#zoom-out')?.addEventListener('click', () => activeGame?.zoomBy(1 / 1.1));
  document.querySelector<HTMLButtonElement>('#music')?.addEventListener('click', (event) => {
    audio.setEnabled(!audio.isEnabled());
    (event.currentTarget as HTMLButtonElement).textContent = audio.isEnabled() ? '♫' : '♪̸';
    if (audio.isEnabled()) audio.playMusic(isBonus ? 'bonus' : `ingame${meta.number % 3}`);
  });
  document.querySelector<HTMLButtonElement>('#debug')?.addEventListener('click', () => {
    activeGame?.toggleDebug();
    debugPanel.classList.toggle('visible', activeGame?.debug ?? false);
  });
  canvas.addEventListener('click', (event) => {
    if (!activeGame?.debug) return;
    const tile: TileInspection | null = activeGame.inspectCanvasPoint(event.clientX, event.clientY);
    debugPanel.textContent = tile ? JSON.stringify(tile, null, 2) : 'Outside map.';
  });
}


async function renderEditorRoute(levelIdRaw?: string): Promise<void> {
  audio.stopMusic();
  let level: EditorLevel;
  const shared = shareValueFromHash(location.hash);
  if (shared) {
    try {
      level = await decodeShareLevel(shared);
    } catch (error) {
      app.innerHTML = shell(`<section class="settings-card"><h2>分享地图无法打开</h2><p class="muted">${escapeHtml(error instanceof Error ? error.message : String(error))}</p><a class="primary-btn" href="/edit" data-nav>新建地图</a></section>`);
      bindNavigation();
      return;
    }
  } else if (levelIdRaw) {
    const decoded = decodeURIComponent(levelIdRaw).toLowerCase();
    const meta = catalog.levels.find((entry) => entry.publicId === decoded || entry.id === decoded.padStart(3, '0'));
    if (!meta) { navigate('/edit'); return; }
    const official = await fetchJson<LevelData>(`/assets/${meta.path}`);
    level = fromLevelData(official);
    level.name = `${meta.publicId.toUpperCase()} · Copy`;
  } else {
    level = createBlankLevel(16, 16);
  }

  app.innerHTML = '<div id="editor-mount"></div>';
  const root = document.querySelector<HTMLElement>('#editor-mount');
  if (!root) throw new Error('Editor mount failed');
  activeEditor = new BobbyEditor({
    root,
    level,
    atlasUrl: '/assets/art/hd/ts.png',
    animationAtlasUrl: '/assets/art/hd/ta.png',
    bobbyUrls: {
      left: '/assets/art/hd/b0.png',
      right: '/assets/art/hd/b1.png',
      up: '/assets/art/hd/b2.png',
      down: '/assets/art/hd/b3.png'
    },
    mowerBobbyUrl: '/assets/art/hd/b7.png',
    kiteUrl: '/assets/art/hd/b9.png',
    audio,
    shareOrigin: location.origin,
    onClose: () => navigate('/levels')
  });
}

async function renderSharedGame(): Promise<void> {
  const encoded = shareValueFromHash(location.hash);
  if (!encoded) { navigate('/edit'); return; }
  let editorLevel: EditorLevel;
  try {
    editorLevel = await decodeShareLevel(encoded);
  } catch (error) {
    app.innerHTML = shell(`<section class="settings-card"><h2>分享地图无法打开</h2><p class="muted">${escapeHtml(error instanceof Error ? error.message : String(error))}</p><a class="primary-btn" href="/edit" data-nav>打开编辑器</a></section>`);
    bindNavigation();
    return;
  }
  const level = toLevelData(editorLevel);
  audio.playMusic('ingame0');
  app.innerHTML = `<div class="game-page">
    <header class="game-toolbar">
      <button id="back" class="ghost-btn">← 首页</button>
      <span class="level-label">${escapeHtml(editorLevel.name)}</span>
      <span class="muted hide-mobile">Custom JSON · ${editorLevel.width}×${editorLevel.height}</span>
      <div class="spacer"></div>
      <button id="edit-level" class="icon-btn">Edit</button>
      <button id="undo" class="icon-btn">Undo</button>
      <button id="restart" class="icon-btn">Restart</button>
      <button id="zoom-out" class="icon-btn">−</button>
      <span id="zoom" class="muted">100%</span>
      <button id="zoom-in" class="icon-btn">+</button>
    </header>
    <main class="game-stage">
      <canvas id="game"></canvas>
      <div id="status" class="game-status">正在载入分享地图…</div>
      <div class="touch-hint">Swipe to move · pinch to zoom</div>
      <div id="game-result" class="game-result" hidden><section class="result-card"></section></div>
    </main>
  </div>`;
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  const status = document.querySelector<HTMLDivElement>('#status');
  const zoom = document.querySelector<HTMLSpanElement>('#zoom');
  const result = document.querySelector<HTMLDivElement>('#game-result');
  const resultCard = result?.querySelector<HTMLElement>('.result-card');
  if (!canvas || !status || !zoom || !result || !resultCard) throw new Error('Shared game UI failed to mount');

  activeGame = new Game({
    canvas,
    audio,
    assets: {
      atlasUrl: '/assets/art/hd/ts.png',
      animationAtlasUrl: '/assets/art/hd/ta.png',
      bobbyUrls: { left:'/assets/art/hd/b0.png', right:'/assets/art/hd/b1.png', up:'/assets/art/hd/b2.png', down:'/assets/art/hd/b3.png' },
      mowerBobbyUrl: '/assets/art/hd/b7.png',
      kiteUrl: '/assets/art/hd/b9.png',
      sourceTileSize: 48
    }
  });
  activeInput = new InputController(activeGame);
  await activeGame.loadLevel(level);

  const update = (): void => {
    if (!activeGame?.hasLevel) return;
    const world = activeGame.world;
    zoom.textContent = `${Math.round(activeGame.zoom * 100)}%`;
    status.textContent = `Custom · Bobby ${world.player.x},${world.player.y} · 目标 ${world.objectiveTotal - world.objectiveRemaining}/${world.objectiveTotal}`;
    if ((world.dead || world.completed) && activeGame && !activeGame.isAnimating) {
      resultCard.innerHTML = world.completed
        ? `<div class="result-kicker">CUSTOM LEVEL</div><h2>关卡完成</h2><div class="result-actions"><button class="primary-btn" data-shared="edit">编辑这个地图</button><button class="ghost-btn" data-shared="replay">重玩</button></div>`
        : `<div class="result-kicker danger">BOBBY FAILED</div><h2>失败</h2><p>${escapeHtml(world.state.deathReason ?? '')}</p><div class="result-actions"><button class="primary-btn" data-shared="edit">编辑这个地图</button><button class="ghost-btn" data-shared="replay">重试</button></div>`;
      result.hidden = false;
    }
  };
  activeGame.on('change', update);
  update();
  document.querySelector<HTMLButtonElement>('#back')?.addEventListener('click', () => navigate('/'));
  document.querySelector<HTMLButtonElement>('#edit-level')?.addEventListener('click', () => navigate(`/edit${location.hash}`));
  document.querySelector<HTMLButtonElement>('#undo')?.addEventListener('click', () => activeGame?.undo());
  document.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', () => { activeGame?.restart(); result.hidden = true; });
  document.querySelector<HTMLButtonElement>('#zoom-in')?.addEventListener('click', () => activeGame?.zoomBy(1.1));
  document.querySelector<HTMLButtonElement>('#zoom-out')?.addEventListener('click', () => activeGame?.zoomBy(1 / 1.1));
  result.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-shared]');
    if (!button) return;
    if (button.dataset.shared === 'edit') navigate(`/edit${location.hash}`);
    else { activeGame?.restart(); result.hidden = true; }
  });
}

function renderSettings(): void {
  audio.playMusic('title');
  const profile = loadProfile();
  app.innerHTML = shell(`
    <div class="section-title"><h1>设置</h1><p>原始 MIDI 通过 WebAudio TinySynth 直接在浏览器合成播放。</p></div>
    <section class="profile-strip"><div><strong>${profile.bonusCoins}</strong><span>Bonus Coin</span></div><div><strong>${profile.goldenCarrots}</strong><span>Golden Carrot</span></div><div><strong>${profile.superKey ? '已获得' : '未获得'}</strong><span>Super Key</span></div></section>
    <section class="settings-card">
      <div class="setting"><div><strong>音乐</strong><div class="muted">WebAudio TinySynth 1.1.4 · 原始 .mid</div></div><label class="switch-label"><input id="music-enabled" type="checkbox" ${audio.isEnabled() ? 'checked' : ''}> 启用</label></div>
      <div class="setting"><div><strong>音乐音量</strong><div class="muted">0–100%</div></div><input id="music-volume" type="range" min="0" max="100" value="${Math.round(audio.getMusicVolume() * 100)}"></div>
      <div class="setting"><div><strong>音效音量</strong><div class="muted">收集/机关反馈</div></div><input id="sound-volume" type="range" min="0" max="100" value="${Math.round(audio.getSoundVolume() * 100)}"></div>
      <div class="setting"><div><strong>美术</strong><div class="muted">UP9 HD 48px 原版素材</div></div><span>启用</span></div>
      <div class="setting"><div><strong>操作</strong><div class="muted">WASD / 方向键 / Swipe / Pinch Zoom</div></div><span>Modern</span></div>
    </section>
  `);
  bindNavigation();
  document.querySelector<HTMLInputElement>('#music-enabled')?.addEventListener('change', (event) => audio.setEnabled((event.currentTarget as HTMLInputElement).checked));
  document.querySelector<HTMLInputElement>('#music-volume')?.addEventListener('input', (event) => audio.setMusicVolume(Number((event.currentTarget as HTMLInputElement).value) / 100));
  document.querySelector<HTMLInputElement>('#sound-volume')?.addEventListener('input', (event) => audio.setSoundVolume(Number((event.currentTarget as HTMLInputElement).value) / 100));
}

function requestBonusAccess(profile: PlayerProfile, overlay: HTMLDivElement, card: HTMLElement): Promise<boolean> {
  return new Promise((resolve) => {
    const canBuy = profile.bonusCoins >= 3;
    card.innerHTML = `
      <div class="result-kicker">BEAVER BONUS ROUND</div>
      <h2>奖励关钥匙</h2>
      <p>${canBuy
        ? `原版规则：没有 Super Key 时，可花 <strong>3 Bonus Coin</strong> 向 Beaver 购买本关的一次性钥匙。当前有 ${profile.bonusCoins} 个。`
        : `你没有足够的 Bonus Coin。原版 Beaver 还留了一个例外：<strong>Pretty please.</strong>`}</p>
      <div class="result-actions">
        <button class="primary-btn" data-bonus-access="enter">${canBuy ? '花 3 Coin 进入' : 'Pretty please · 免费进入'}</button>
        <button class="ghost-btn" data-bonus-access="back">返回选关</button>
      </div>`;
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
      } else resolve(false);
    };
    overlay.addEventListener('click', handler);
  });
}

function displayLevelId(level: CatalogLevel): string {
  return level.publicId.toUpperCase();
}

function bindNavigation(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      navigate(new URL(anchor.href).pathname);
    });
  });
}

async function renderRoute(): Promise<void> {
  activeInput?.destroy();
  activeInput = null;
  activeGame?.destroy();
  activeGame = null;
  activeEditor?.destroy();
  activeEditor = null;
  const path = location.pathname.replace(/\/+$/, '') || '/';
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
