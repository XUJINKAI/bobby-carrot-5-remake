from pathlib import Path
import re

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, text: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding='utf-8')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)


# Input: canvas drag pans the map, pinch zooms, keyboard remains held-state movement.
write('engine/src/input/InputController.ts', r'''import type { Game } from '../core/Game.js';
import type { Direction } from '../mechanics/ids.js';

interface PointerState {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
}

const KEY_DIRECTION: Record<string, Direction> = {
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right'
};

/** 输入层只表达当前意图：键盘/移动端方向键负责移动，画布拖动只负责相机。 */
export class InputController {
  private readonly game: Game;
  private readonly canvas: HTMLCanvasElement;
  private readonly pointers = new Map<number, PointerState>();
  private readonly heldMovementKeys: string[] = [];
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;
  private suppressNextClick = false;
  private enabled = true;

  constructor(game: Game) {
    this.game = game;
    this.canvas = game.renderer.canvas;
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
    window.addEventListener('blur', this.onBlur);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value) this.clearHeldMovement();
  }

  consumePointerClickSuppression(): boolean {
    const value = this.suppressNextClick;
    this.suppressNextClick = false;
    return value;
  }

  destroy(): void {
    this.clearHeldMovement();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || !this.game.hasLevel) return;
    const key = event.key.toLowerCase();
    const direction = KEY_DIRECTION[key];
    if (direction) {
      event.preventDefault();
      if (!event.repeat && !this.heldMovementKeys.includes(key)) this.heldMovementKeys.push(key);
      this.game.setHeldDirection(this.currentHeldDirection());
      return;
    }
    if (event.repeat) return;
    if (key === 'r') this.game.restart();
    else if (key === 'z' || key === 'u') this.game.undo();
    else if (key === '=' || key === '+') this.game.zoomBy(1.1);
    else if (key === '-' || key === '_') this.game.zoomBy(1 / 1.1);
    else if (event.code === 'Backquote' || key === '`' || key === '~') this.game.toggleDebug();
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (!KEY_DIRECTION[key]) return;
    event.preventDefault();
    const index = this.heldMovementKeys.lastIndexOf(key);
    if (index >= 0) this.heldMovementKeys.splice(index, 1);
    this.game.setHeldDirection(this.currentHeldDirection());
  };

  private readonly onBlur = (): void => this.clearHeldMovement();

  private clearHeldMovement(): void {
    this.heldMovementKeys.length = 0;
    this.game.setHeldDirection(null);
  }

  private currentHeldDirection(): Direction | null {
    const key = this.heldMovementKeys[this.heldMovementKeys.length - 1];
    return key ? KEY_DIRECTION[key] ?? null : null;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, {
      x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY,
      moved: false
    });
    if (this.pointers.size === 2) {
      this.pinchStartDistance = this.pointerDistance();
      this.pinchStartZoom = this.game.zoom;
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) >= 4) pointer.moved = true;

    if (this.pointers.size === 2 && this.pinchStartDistance > 0) {
      this.game.setZoom(this.pinchStartZoom * (this.pointerDistance() / this.pinchStartDistance));
      return;
    }
    if (this.pointers.size === 1 && (dx !== 0 || dy !== 0)) this.game.panByScreen(dx, dy);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const pointer = this.pointers.get(event.pointerId);
    const wasPinching = this.pointers.size >= 2;
    this.pointers.delete(event.pointerId);
    if (pointer?.moved || wasPinching) this.suppressNextClick = true;
    if (this.pointers.size < 2) this.pinchStartDistance = 0;
    for (const remaining of this.pointers.values()) {
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      remaining.moved = false;
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
    this.game.zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08);
  };

  private pointerDistance(): number {
    const values = [...this.pointers.values()];
    const a = values[0];
    const b = values[1];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
''')

# Game exposes camera pan and recenters only when the level itself is reset/reloaded.
game = read('engine/src/core/Game.ts')
game = replace_once(game,
'''    this.worldValue = new World(structuredClone(level), this.profile);
    this.history.length = 0;''',
'''    this.worldValue = new World(structuredClone(level), this.profile);
    this.renderer.camera.resetPan();
    this.history.length = 0;''', 'Game.loadLevel pan reset')
game = replace_once(game,
'''  zoomBy(factor: number): void { this.setZoom(this.zoom * factor); }
''',
'''  zoomBy(factor: number): void { this.setZoom(this.zoom * factor); }

  panByScreen(dx: number, dy: number): void {
    this.renderer.camera.panByScreen(dx, dy);
    this.render();
  }
''', 'Game.panByScreen')
game = replace_once(game,
'''    this.worldValue = new World(structuredClone(this.initialLevel), this.profile);
    this.history.length = 0;''',
'''    this.worldValue = new World(structuredClone(this.initialLevel), this.profile);
    this.renderer.camera.resetPan();
    this.history.length = 0;''', 'Game.restart pan reset')
write('engine/src/core/Game.ts', game)

# Renderer: DEBUG only draws tile borders; b4 is idle/foot-tap, b5 is death animation.
renderer = read('engine/src/render/Renderer.ts')
renderer = replace_once(renderer,
'''  mowerBobbyUrl?: string;
  sourceTileSize?: number;''',
'''  mowerBobbyUrl?: string;
  idleBobbyUrl?: string;
  deathBobbyUrl?: string;
  sourceTileSize?: number;''', 'Renderer asset options')
renderer = replace_once(renderer,
'''  private mowerBobby: HTMLImageElement | null = null;
  private debug = false;''',
'''  private mowerBobby: HTMLImageElement | null = null;
  private idleBobby: HTMLImageElement | null = null;
  private deathBobby: HTMLImageElement | null = null;
  private idleSince = performance.now();
  private deathSince: number | null = null;
  private lastPlayerCell = '';
  private debug = false;''', 'Renderer sprite fields')
renderer = replace_once(renderer,
'''    const [atlas, animationAtlas, right, left, up, down, kite, mower] = await Promise.all([
      loadImage(assets.atlasUrl),
      assets.animationAtlasUrl ? loadImage(assets.animationAtlasUrl) : Promise.resolve(null),
      loadImage(urls.right), loadImage(urls.left), loadImage(urls.up), loadImage(urls.down),
      assets.kiteUrl ? loadImage(assets.kiteUrl) : Promise.resolve(null),
      assets.mowerBobbyUrl ? loadImage(assets.mowerBobbyUrl) : Promise.resolve(null)
    ]);''',
'''    const [atlas, animationAtlas, right, left, up, down, kite, mower, idle, death] = await Promise.all([
      loadImage(assets.atlasUrl),
      assets.animationAtlasUrl ? loadImage(assets.animationAtlasUrl) : Promise.resolve(null),
      loadImage(urls.right), loadImage(urls.left), loadImage(urls.up), loadImage(urls.down),
      assets.kiteUrl ? loadImage(assets.kiteUrl) : Promise.resolve(null),
      assets.mowerBobbyUrl ? loadImage(assets.mowerBobbyUrl) : Promise.resolve(null),
      assets.idleBobbyUrl ? loadImage(assets.idleBobbyUrl) : Promise.resolve(null),
      assets.deathBobbyUrl ? loadImage(assets.deathBobbyUrl) : Promise.resolve(null)
    ]);''', 'Renderer load sprites')
renderer = replace_once(renderer,
'''    this.kite = kite;
    this.mowerBobby = mower;
    this.loaded = true;''',
'''    this.kite = kite;
    this.mowerBobby = mower;
    this.idleBobby = idle;
    this.deathBobby = death;
    this.loaded = true;''', 'Renderer assign sprites')
renderer, removed = re.subn(r'''\n\s*if \(size >= 40\) \{\n\s*ctx\.fillStyle = 'rgba\(0,0,0,\.55\)';[\s\S]*?ctx\.fillText\(shortSemanticLabel\(terrain\), screen\.x \+ 5, screen\.y \+ 12\);\n\s*\}''', '', renderer, count=1)
if removed != 1:
    raise RuntimeError(f'Renderer debug labels: expected 1 match, found {removed}')
renderer = replace_once(renderer,
'''    const forcedKind = world.forcedKind;

    if (forcedKind === 'flight' && this.kite) {''',
'''    const forcedKind = world.forcedKind;
    const now = performance.now();
    const playerCell = `${world.player.x},${world.player.y}`;
    if (playerCell !== this.lastPlayerCell || visual.moving || forcedKind || world.ridingMower) {
      this.lastPlayerCell = playerCell;
      this.idleSince = now;
    }

    if (world.dead && this.deathBobby) {
      if (this.deathSince === null) this.deathSince = now;
      this.drawBobbyStrip(this.deathBobby, screen.x, screen.y, size, Math.min(1, (now - this.deathSince) / 800));
      return;
    }
    this.deathSince = null;

    if (forcedKind === 'flight' && this.kite) {''', 'Renderer idle/death state')
renderer = replace_once(renderer,
'''    const spriteDirection: Direction = world.isPlayerClimbing ? 'up' : visual.direction;
    const image = this.bobby.get(spriteDirection) ?? this.bobby.get('down');
    if (!image) return;''',
'''    if (!visual.moving && !forcedKind && !world.ridingMower && !world.isPlayerClimbing && this.idleBobby && now - this.idleSince >= 5000) {
      const loop = ((now - this.idleSince - 5000) % 900) / 900;
      this.drawBobbyStrip(this.idleBobby, screen.x, screen.y, size, loop);
      return;
    }

    const spriteDirection: Direction = world.isPlayerClimbing ? 'up' : visual.direction;
    const image = this.bobby.get(spriteDirection) ?? this.bobby.get('down');
    if (!image) return;''', 'Renderer idle strip')
renderer = replace_once(renderer,
'''  private snappedTileRect(x: number, y: number, size: number): { x: number; y: number; width: number; height: number } {''',
'''  private drawBobbyStrip(image: HTMLImageElement, x: number, y: number, size: number, progress: number): void {
    const frameWidth = this.sourceTileSize;
    const frameHeight = image.height;
    const frameCount = Math.max(1, Math.floor(image.width / frameWidth));
    const frame = Math.min(frameCount - 1, Math.floor(Math.max(0, Math.min(0.999999, progress)) * frameCount));
    const scale = size / this.sourceTileSize;
    const drawHeight = frameHeight * scale;
    this.context.drawImage(image, frame * frameWidth, 0, frameWidth, frameHeight, x, y + size - drawHeight, size, drawHeight);
  }

  private snappedTileRect(x: number, y: number, size: number): { x: number; y: number; width: number; height: number } {''', 'Renderer strip helper')
renderer, removed = re.subn(r'''\nfunction shortSemanticLabel\(type: string\): string \{[\s\S]*?\n\}''', '', renderer, count=1)
if removed != 1:
    raise RuntimeError(f'Renderer label helper: expected 1 match, found {removed}')
write('engine/src/render/Renderer.ts', renderer)

# Static entry uses <base>; Pages later rewrites it to the project path.
html = read('web/index.html')
html = replace_once(html, '  <meta charset="UTF-8" />\n', '  <meta charset="UTF-8" />\n  <base href="/" />\n', 'index base')
html = html.replace('href="/style.css"', 'href="style.css"')
html = html.replace('href="/editor.css"', 'href="editor.css"')
html = html.replace('"@bobby/engine":"/engine/index.js","@bobby/editor":"/editor/index.js"', '"@bobby/engine":"engine/index.js","@bobby/editor":"editor/index.js"')
html = html.replace('src="/app.js"', 'src="app.js"')
write('web/index.html', html)

# Pages also needs TinySynth and MIDI requests to resolve from the configured base path.
audio = read('web/src/TinySynthAudio.ts')
audio = replace_once(audio,
"const LOCAL_TINYSYNTH_URL = '/vendor/webaudio-tinysynth.min.js';",
"const LOCAL_TINYSYNTH_URL = new URL('vendor/webaudio-tinysynth.min.js', document.baseURI).href;",
'TinySynth local URL')
audio = replace_once(audio,
"      const response = await fetch(`/assets/audio/midi/${encodeURIComponent(id)}.mid`);",
"      const response = await fetch(new URL(`assets/audio/midi/${encodeURIComponent(id)}.mid`, document.baseURI));",
'TinySynth MIDI URL')
write('web/src/TinySynthAudio.ts', audio)

main = read('web/src/main.ts')
# All UI-created resource URLs and anchor hrefs become base-relative.
main = main.replace('/assets/', 'assets/')
main = main.replace('href="/', 'href="')
main = replace_once(main,
'''const app: HTMLDivElement = rootElement;

const catalog = await fetchJson<LevelCatalog>('assets/catalog.json');''',
'''const app: HTMLDivElement = rootElement;
const siteUrl = (path: string): string => new URL(path.replace(/^\\/+/, ''), document.baseURI).href;

const catalog = await fetchJson<LevelCatalog>(siteUrl('assets/catalog.json'));''', 'main siteUrl')
main = replace_once(main,
'''function navigate(path: string): void {
  history.pushState(null, '', path);
  void renderRoute();
}''',
'''function navigate(path: string): void {
  const target = new URL(path.replace(/^\\/+/, ''), document.baseURI);
  history.pushState(null, '', `${target.pathname}${target.search}${target.hash}`);
  void renderRoute();
}''', 'main navigate')
main = replace_once(main,
'''        <span class="hud-chip" title="本次游玩时间">⏱ <strong id="hud-time">00:00</strong></span>
        <span class="hud-chip" title="剩余主要目标">🥕 <strong id="hud-objectives">—</strong></span>''',
'''        <span class="hud-chip" title="本次游玩时间"><strong id="hud-time">00:00</strong></span>
        <span class="hud-chip" title="剩余主要目标"><span id="hud-objective-icon" class="hud-art hud-carrot" aria-hidden="true"></span><strong id="hud-objectives">—</strong></span>''', 'HUD objective/time')
main = replace_once(main,
'''        <span class="hud-chip step-chip" title="移动步数">👣 <strong id="hud-moves">0</strong></span>''',
'''        <span class="hud-chip step-chip" title="移动步数"><strong id="hud-moves">0</strong><span class="hud-text-label">STEPS</span></span>''', 'HUD moves')
main = replace_once(main,
'''      <canvas id="game"></canvas>
      <div id="status" class="game-status">正在载入关卡…</div>''',
'''      <canvas id="game"></canvas>
      <div class="mobile-dpad" aria-label="移动方向">
        <button data-move="up" aria-label="向上">↑</button><button data-move="left" aria-label="向左">←</button>
        <button data-move="down" aria-label="向下">↓</button><button data-move="right" aria-label="向右">→</button>
      </div>
      <aside id="debug-panel" class="debug-panel" aria-live="polite"></aside>
      <div id="status" class="game-status">正在载入关卡…</div>''', 'official mobile/debug UI')
main = main.replace('''        <p>触屏 Swipe：移动一格。</p>
        <p>鼠标滚轮 / 双指 Pinch：放大缩小。</p>
        <p><kbd>~</kbd>：DEBUG。开启后点击地图格，调试信息会显示在左下角状态栏。</p>''',
'''        <p>手机方向键：按住连续移动；抬起后当前格结束即停。</p>
        <p>鼠标/单指拖动地图；鼠标滚轮 / 双指 Pinch：放大缩小。</p>
        <p><kbd>~</kbd>：DEBUG。开启后地图只显示格线，点击格子后右侧显示详情。</p>''')
main = replace_once(main,
'''  const status = document.querySelector<HTMLDivElement>('#status');
  const gameResult = document.querySelector<HTMLDivElement>('#game-result');''',
'''  const status = document.querySelector<HTMLDivElement>('#status');
  const debugPanel = document.querySelector<HTMLElement>('#debug-panel');
  const gameResult = document.querySelector<HTMLDivElement>('#game-result');''', 'debug panel query')
main = replace_once(main,
'''  const hudObjectives = document.querySelector<HTMLElement>('#hud-objectives');
  const hudMoves = document.querySelector<HTMLElement>('#hud-moves');
  const hudItems = document.querySelector<HTMLElement>('#hud-items');
  if (!canvas || !status || !gameResult || !resultCard || !hudTime || !hudObjectives || !hudMoves || !hudItems) throw new Error('Game UI failed to mount');''',
'''  const hudObjectives = document.querySelector<HTMLElement>('#hud-objectives');
  const hudObjectiveIcon = document.querySelector<HTMLElement>('#hud-objective-icon');
  const hudMoves = document.querySelector<HTMLElement>('#hud-moves');
  const hudItems = document.querySelector<HTMLElement>('#hud-items');
  if (!canvas || !status || !debugPanel || !gameResult || !resultCard || !hudTime || !hudObjectives || !hudObjectiveIcon || !hudMoves || !hudItems) throw new Error('Game UI failed to mount');''', 'HUD/debug required nodes')
main = replace_once(main,
'''  const level = await fetchJson<LevelData>(`assets/${meta.path}`);''',
'''  const level = await fetchJson<LevelData>(siteUrl(`assets/${meta.path}`));''', 'official level fetch')
main = replace_once(main,
'''      mowerBobbyUrl: 'assets/art/hd/b7.png', kiteUrl: 'assets/art/hd/b9.png', sourceTileSize: 48''',
'''      mowerBobbyUrl: 'assets/art/hd/b7.png', idleBobbyUrl: 'assets/art/hd/b4.png', deathBobbyUrl: 'assets/art/hd/b5.png',
      kiteUrl: 'assets/art/hd/b9.png', sourceTileSize: 48''', 'official b4/b5 assets')
main = replace_once(main,
'''  activeInput = new InputController(activeGame);
  await activeGame.loadLevel(level);''',
'''  activeInput = new InputController(activeGame);
  bindMobileControls(activeGame);
  await activeGame.loadLevel(level);''', 'official mobile controls')
main = replace_once(main,
'''    hudObjectives.textContent = String(world.objectiveRemaining);
    hudMoves.textContent = String(world.state.moves);
    const items: string[] = [];
    if (world.state.profile.superKey) items.push('<span class="item-chip" title="Super Key">🔑+</span>');
    else if (world.state.profile.temporaryKey) items.push('<span class="item-chip" title="本关钥匙">🔑</span>');
    if (world.state.inventory.gas) items.push('<span class="item-chip" title="汽油">⛽</span>');
    if (world.state.inventory.shovel) items.push('<span class="item-chip" title="雪铲">🛠</span>');
    if (world.state.inventory.kite) items.push('<span class="item-chip" title="风筝">◇</span>');
    if (world.state.inventory.beans > 0) items.push(`<span class="item-chip" title="魔豆">🌱${world.state.inventory.beans}</span>`);
    if (world.state.goldenCarrotsInLevel > 0) items.push(`<span class="item-chip" title="本关金胡萝卜">🥕★${world.state.goldenCarrotsInLevel}</span>`);
    if (world.state.bonusCoinsInLevel > 0) items.push(`<span class="item-chip" title="本关 Bonus Coin">●${world.state.bonusCoinsInLevel}</span>`);
    if (world.state.bonusTimeRemainingMs !== null) items.push(`<span class="item-chip bonus-time" title="Bonus 剩余时间">⌛${Math.ceil(world.state.bonusTimeRemainingMs / 1000)}s</span>`);
    hudItems.innerHTML = items.join('');''',
'''    hudObjectives.textContent = String(world.objectiveRemaining);
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
    hudItems.innerHTML = items.join('');''', 'HUD original art')
main = replace_once(main,
'''    if (activeGame.debug && debugInspection) {
      status.textContent = debugInspection;
      status.classList.add('debug');
    } else {
      status.classList.remove('debug');
      const move = activeGame.lastMove;
      status.textContent = activeGame.debug
        ? 'DEBUG · 点击地图格查看 Terrain / Object / Dynamic 状态'
        : move ? `${move.moved ? '移动' : '阻挡'} · ${move.passage.reason}` : `${displayLevelId(meta)} · 准备就绪`;
    }''',
'''    debugPanel.classList.toggle('visible', activeGame.debug);
    debugPanel.textContent = activeGame.debug ? (debugInspection ?? 'DEBUG\\n点击地图格查看详情') : '';
    status.classList.remove('debug');
    const move = activeGame.lastMove;
    status.textContent = move ? `${move.moved ? '移动' : '阻挡'} · ${move.passage.reason}` : `${displayLevelId(meta)} · 准备就绪`;''', 'DEBUG right panel')
main = replace_once(main,
'''  canvas.addEventListener('click', (event) => {
    if (!activeGame?.debug) return;
    const tile: TileInspection | null = activeGame.inspectCanvasPoint(event.clientX, event.clientY);
    debugInspection = tile ? formatTileInspection(tile) : 'DEBUG · 地图外';
    update();
  });''',
'''  canvas.addEventListener('click', (event) => {
    if (!activeGame?.debug || activeInput?.consumePointerClickSuppression()) return;
    const tile: TileInspection | null = activeGame.inspectCanvasPoint(event.clientX, event.clientY);
    debugInspection = tile ? formatTileInspection(tile, activeGame) : 'DEBUG\\n地图外';
    update();
  });''', 'DEBUG click')
main = replace_once(main,
'''function formatTileInspection(tile: TileInspection): string {
  const dynamic = tile.dynamicEntity ? ` · Dynamic ${tile.dynamicEntity.type}` : '';
  return `DEBUG ${tile.x},${tile.y} · Terrain ${tile.terrainType} · Object ${tile.object ? tile.objectType : 'empty'}${dynamic}${tile.isPlayer ? ' · BOBBY' : ''}`;
}''',
'''function formatTileInspection(tile: TileInspection, game: Game): string {
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
  ].filter(Boolean).join('\\n');
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
}''', 'rich DEBUG + mobile binder')
main = replace_once(main,
'''    shareOrigin: location.origin, onClose: () => navigate('/levels')''',
'''    shareOrigin: new URL('.', document.baseURI).href.replace(/\\/$/, ''), onClose: () => navigate('/levels')''', 'editor share base')
main = replace_once(main,
'''    <main class="game-stage"><canvas id="game"></canvas><div id="status" class="game-status">正在载入分享地图…</div><div id="game-result" class="game-result" hidden><section class="result-card"></section></div></main>''',
'''    <main class="game-stage"><canvas id="game"></canvas><div class="mobile-dpad" aria-label="移动方向"><button data-move="up" aria-label="向上">↑</button><button data-move="left" aria-label="向左">←</button><button data-move="down" aria-label="向下">↓</button><button data-move="right" aria-label="向右">→</button></div><div id="status" class="game-status">正在载入分享地图…</div><div id="game-result" class="game-result" hidden><section class="result-card"></section></div></main>''', 'shared mobile controls UI')
main = replace_once(main,
'''    mowerBobbyUrl:'assets/art/hd/b7.png', kiteUrl:'assets/art/hd/b9.png', sourceTileSize:48''',
'''    mowerBobbyUrl:'assets/art/hd/b7.png', idleBobbyUrl:'assets/art/hd/b4.png', deathBobbyUrl:'assets/art/hd/b5.png', kiteUrl:'assets/art/hd/b9.png', sourceTileSize:48''', 'shared b4/b5 assets')
# Second InputController construction belongs to the shared game.
needle = '''  activeInput = new InputController(activeGame);
  await activeGame.loadLevel(level);'''
if main.count(needle) != 1:
    raise RuntimeError(f'shared mobile controls: expected 1 remaining match, found {main.count(needle)}')
main = main.replace(needle, '''  activeInput = new InputController(activeGame);
  bindMobileControls(activeGame);
  await activeGame.loadLevel(level);''', 1)
main = main.replace('WASD / 方向键 / Swipe / Wheel / Pinch / ~ DEBUG', 'WASD / 方向键 / Drag / Wheel / Pinch / ~ DEBUG')
main = replace_once(main,
'''  document.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => { event.preventDefault(); navigate(new URL(anchor.href).pathname); });
  });''',
'''  document.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => { event.preventDefault(); navigate(anchor.getAttribute('href') ?? '/'); });
  });''', 'base-aware anchor navigation')
main = replace_once(main,
'''  const path = location.pathname.replace(/\\/+$/, '') || '/';''',
'''  const basePath = new URL(document.baseURI).pathname.replace(/\\/+$/, '');
  const localPath = basePath && basePath !== '/' && location.pathname.startsWith(basePath) ? location.pathname.slice(basePath.length) : location.pathname;
  const path = localPath.replace(/\\/+$/, '') || '/';''', 'base-aware route')
write('web/src/main.ts', main)

css = read('web/style.css')
css += r'''

/* Original HUD art, mobile held-direction input and DEBUG inspector. */
.hud-art{display:inline-block;height:38px;overflow:hidden;flex:0 0 auto;background-image:url("assets/art/hd/hud.png");background-repeat:no-repeat;background-size:350px 38px}
.hud-carrot{width:39px;background-position:-42px 0}.hud-gas{width:37px;background-position:-83px 0}.hud-key{width:20px;background-position:-122px 0}.hud-kite{width:35px;background-position:-144px 0}.hud-shovel{width:37px;background-position:-179px 0}.hud-egg{width:29px;background-position:-217px 0}.hud-bean{width:35px;background-position:-247px 0}
.hud-golden-carrot{display:block;max-height:32px;width:auto}.hud-text-label{font-size:.58rem;color:var(--muted);letter-spacing:.08em}.hud-chip:has(.hud-art),.item-chip:has(.hud-art){height:42px;padding-top:1px;padding-bottom:1px}
.mobile-dpad{display:none}.debug-panel{z-index:6;line-height:1.45;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
@media(max-width:700px){
  .game-page{height:100dvh}
  .game-toolbar #edit-level{display:none!important}
  .mobile-dpad{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(2,52px);gap:5px;z-index:7;touch-action:none}
  .mobile-dpad button{border:1px solid #ffffff35;background:#0b140ecf;color:#eef5ef;border-radius:14px;font-size:1.35rem;backdrop-filter:blur(8px);touch-action:none;user-select:none;-webkit-user-select:none}
  .mobile-dpad button[data-move=up]{grid-column:2;grid-row:1}.mobile-dpad button[data-move=left]{grid-column:1;grid-row:2}.mobile-dpad button[data-move=down]{grid-column:2;grid-row:2}.mobile-dpad button[data-move=right]{grid-column:3;grid-row:2}
  .game-status{right:190px;max-width:none}
  .debug-panel{left:12px;right:12px;top:12px;width:auto;max-height:46%}
}
'''
write('web/style.css', css)

write('.github/workflows/pages.yml', r'''name: pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - uses: actions/configure-pages@v5
        id: pages
      - run: npm ci
      - run: npm run verify
      - name: Prepare GitHub Pages base path
        env:
          PAGES_BASE: ${{ steps.pages.outputs.base_path }}
        run: |
          node - <<'NODE'
          const fs = require('fs');
          const path = require('path');
          const root = 'dist/web';
          const base = (process.env.PAGES_BASE || '').replace(/\/$/, '') + '/';
          for (const entry of fs.readdirSync(root, { recursive: true })) {
            if (!entry.endsWith('.html')) continue;
            const file = path.join(root, entry);
            const text = fs.readFileSync(file, 'utf8').replace('<base href="/" />', '<base href="' + base + '" />');
            fs.writeFileSync(file, text);
          }
          fs.writeFileSync(path.join(root, '.nojekyll'), '');
          NODE
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/web

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
''')

print('Applied requested mobile, debug, HUD, idle/death and Pages changes.')
