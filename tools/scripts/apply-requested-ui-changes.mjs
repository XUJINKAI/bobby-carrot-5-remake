import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);
function replaceOnce(text, from, to, label) {
  const i = text.indexOf(from);
  if (i < 0) throw new Error(`Missing replacement target: ${label}`);
  if (text.indexOf(from, i + from.length) >= 0) throw new Error(`Replacement target not unique: ${label}`);
  return text.slice(0, i) + to + text.slice(i + from.length);
}

// Camera: persistent pan offset layered on top of Bobby-follow.
write('engine/src/render/Camera.ts', `export interface CameraPoint { x: number; y: number; }

export class Camera {
  centerX = 0;
  centerY = 0;
  viewportWidth = 1;
  viewportHeight = 1;
  zoom = 1;
  readonly sourceTileSize: number;
  private panOffsetX = 0;
  private panOffsetY = 0;

  constructor(sourceTileSize = 48) {
    this.sourceTileSize = sourceTileSize;
  }

  get tileScreenSize(): number { return this.sourceTileSize * this.zoom; }

  setViewport(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
  }

  setZoom(value: number): void {
    this.zoom = Math.min(2.75, Math.max(0.3, value));
  }

  resetPan(): void {
    this.panOffsetX = 0;
    this.panOffsetY = 0;
  }

  panByScreen(dx: number, dy: number): void {
    const size = this.tileScreenSize;
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || size <= 0) return;
    this.panOffsetX -= dx / size;
    this.panOffsetY -= dy / size;
  }

  follow(point: CameraPoint, worldWidth: number, worldHeight: number): void {
    const baseX = point.x + 0.5;
    const baseY = point.y + 0.5;
    this.centerX = baseX + this.panOffsetX;
    this.centerY = baseY + this.panOffsetY;
    this.clamp(worldWidth, worldHeight);
    this.panOffsetX = this.centerX - baseX;
    this.panOffsetY = this.centerY - baseY;
  }

  worldToScreen(x: number, y: number): CameraPoint {
    const size = this.tileScreenSize;
    return {
      x: (x - this.centerX) * size + this.viewportWidth / 2,
      y: (y - this.centerY) * size + this.viewportHeight / 2
    };
  }

  screenToTile(screenX: number, screenY: number): CameraPoint {
    const size = this.tileScreenSize;
    return {
      x: Math.floor((screenX - this.viewportWidth / 2) / size + this.centerX),
      y: Math.floor((screenY - this.viewportHeight / 2) / size + this.centerY)
    };
  }

  private clamp(worldWidth: number, worldHeight: number): void {
    const visibleWidth = this.viewportWidth / this.tileScreenSize;
    const visibleHeight = this.viewportHeight / this.tileScreenSize;
    if (worldWidth <= visibleWidth) this.centerX = worldWidth / 2;
    else this.centerX = Math.min(worldWidth - visibleWidth / 2, Math.max(visibleWidth / 2, this.centerX));
    if (worldHeight <= visibleHeight) this.centerY = worldHeight / 2;
    else this.centerY = Math.min(worldHeight - visibleHeight / 2, Math.max(visibleHeight / 2, this.centerY));
  }
}
`);

// Input: drag pans the map; pinch zoom remains; movement is handled by held-direction controls.
write('engine/src/input/InputController.ts', `import type { Game } from '../core/Game.js';
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
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false });
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
      const distance = this.pointerDistance();
      this.game.setZoom(this.pinchStartZoom * (distance / this.pinchStartDistance));
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
`);

// Game exposes only the camera operation needed by the input layer and resets pan on level reset.
let game = read('engine/src/core/Game.ts');
game = replaceOnce(game,
`    this.worldValue = new World(structuredClone(level), this.profile);\n    this.history.length = 0;`,
`    this.worldValue = new World(structuredClone(level), this.profile);\n    this.renderer.camera.resetPan();\n    this.history.length = 0;`, 'loadLevel reset pan');
game = replaceOnce(game,
`  zoomBy(factor: number): void { this.setZoom(this.zoom * factor); }\n`,
`  zoomBy(factor: number): void { this.setZoom(this.zoom * factor); }\n\n  panByScreen(dx: number, dy: number): void {\n    this.renderer.camera.panByScreen(dx, dy);\n    this.render();\n  }\n`, 'pan method');
game = replaceOnce(game,
`    this.worldValue = new World(structuredClone(this.initialLevel), this.profile);\n    this.history.length = 0;`,
`    this.worldValue = new World(structuredClone(this.initialLevel), this.profile);\n    this.renderer.camera.resetPan();\n    this.history.length = 0;`, 'restart reset pan');
write('engine/src/core/Game.ts', game);

// Renderer: debug is border-only; b4 idle and b5 death are native Bobby strips.
let renderer = read('engine/src/render/Renderer.ts');
renderer = replaceOnce(renderer,
`  mowerBobbyUrl?: string;\n  sourceTileSize?: number;`,
`  mowerBobbyUrl?: string;\n  idleBobbyUrl?: string;\n  deathBobbyUrl?: string;\n  sourceTileSize?: number;`, 'renderer asset options');
renderer = replaceOnce(renderer,
`  private mowerBobby: HTMLImageElement | null = null;\n  private debug = false;`,
`  private mowerBobby: HTMLImageElement | null = null;\n  private idleBobby: HTMLImageElement | null = null;\n  private deathBobby: HTMLImageElement | null = null;\n  private idleSince = performance.now();\n  private deathSince: number | null = null;\n  private lastPlayerCell = '';\n  private debug = false;`, 'renderer fields');
renderer = replaceOnce(renderer,
`    const [atlas, animationAtlas, right, left, up, down, kite, mower] = await Promise.all([\n      loadImage(assets.atlasUrl),\n      assets.animationAtlasUrl ? loadImage(assets.animationAtlasUrl) : Promise.resolve(null),\n      loadImage(urls.right), loadImage(urls.left), loadImage(urls.up), loadImage(urls.down),\n      assets.kiteUrl ? loadImage(assets.kiteUrl) : Promise.resolve(null),\n      assets.mowerBobbyUrl ? loadImage(assets.mowerBobbyUrl) : Promise.resolve(null)\n    ]);`,
`    const [atlas, animationAtlas, right, left, up, down, kite, mower, idle, death] = await Promise.all([\n      loadImage(assets.atlasUrl),\n      assets.animationAtlasUrl ? loadImage(assets.animationAtlasUrl) : Promise.resolve(null),\n      loadImage(urls.right), loadImage(urls.left), loadImage(urls.up), loadImage(urls.down),\n      assets.kiteUrl ? loadImage(assets.kiteUrl) : Promise.resolve(null),\n      assets.mowerBobbyUrl ? loadImage(assets.mowerBobbyUrl) : Promise.resolve(null),\n      assets.idleBobbyUrl ? loadImage(assets.idleBobbyUrl) : Promise.resolve(null),\n      assets.deathBobbyUrl ? loadImage(assets.deathBobbyUrl) : Promise.resolve(null)\n    ]);`, 'renderer load promise');
renderer = replaceOnce(renderer,
`    this.kite = kite;\n    this.mowerBobby = mower;\n    this.loaded = true;`,
`    this.kite = kite;\n    this.mowerBobby = mower;\n    this.idleBobby = idle;\n    this.deathBobby = death;\n    this.loaded = true;`, 'renderer assign sprites');
renderer = renderer.replace(/\n\s*if \(size >= 40\) \{[\s\S]*?ctx\.fillText\(shortSemanticLabel\(terrain\), screen\.x \+ 5, screen\.y \+ 12\);\n\s*\}/, '');
renderer = replaceOnce(renderer,
`    const forcedKind = world.forcedKind;\n\n    if (forcedKind === 'flight' && this.kite) {`,
`    const forcedKind = world.forcedKind;\n    const now = performance.now();\n    const playerCell = \`${'${world.player.x},${world.player.y}'}\`;\n    if (playerCell !== this.lastPlayerCell || visual.moving || forcedKind || world.ridingMower) {\n      this.lastPlayerCell = playerCell;\n      this.idleSince = now;\n    }\n\n    if (world.dead && this.deathBobby) {\n      if (this.deathSince === null) this.deathSince = now;\n      this.drawBobbyStrip(this.deathBobby, screen.x, screen.y, size, Math.min(1, (now - this.deathSince) / 800), false);\n      return;\n    }\n    this.deathSince = null;\n\n    if (forcedKind === 'flight' && this.kite) {`, 'player idle/death state');
renderer = replaceOnce(renderer,
`    const spriteDirection: Direction = world.isPlayerClimbing ? 'up' : visual.direction;\n    const image = this.bobby.get(spriteDirection) ?? this.bobby.get('down');\n    if (!image) return;`,
`    if (!visual.moving && !forcedKind && !world.ridingMower && !world.isPlayerClimbing && this.idleBobby && now - this.idleSince >= 5000) {\n      const loop = ((now - this.idleSince - 5000) % 900) / 900;\n      this.drawBobbyStrip(this.idleBobby, screen.x, screen.y, size, loop, true);\n      return;\n    }\n\n    const spriteDirection: Direction = world.isPlayerClimbing ? 'up' : visual.direction;\n    const image = this.bobby.get(spriteDirection) ?? this.bobby.get('down');\n    if (!image) return;`, 'idle strip usage');
renderer = replaceOnce(renderer,
`  private snappedTileRect(x: number, y: number, size: number): { x: number; y: number; width: number; height: number } {`,
`  private drawBobbyStrip(image: HTMLImageElement, x: number, y: number, size: number, progress: number, loop: boolean): void {\n    const frameWidth = this.sourceTileSize;\n    const frameHeight = image.height;\n    const frameCount = Math.max(1, Math.floor(image.width / frameWidth));\n    const normalized = loop ? progress % 1 : Math.max(0, Math.min(1, progress));\n    const frame = Math.min(frameCount - 1, Math.floor(normalized * frameCount));\n    const scale = size / this.sourceTileSize;\n    const drawHeight = frameHeight * scale;\n    this.context.drawImage(image, frame * frameWidth, 0, frameWidth, frameHeight, x, y + size - drawHeight, size, drawHeight);\n  }\n\n  private snappedTileRect(x: number, y: number, size: number): { x: number; y: number; width: number; height: number } {`, 'strip helper');
renderer = renderer.replace(/\nfunction shortSemanticLabel\([\s\S]*?\n\}/, '');
write('engine/src/render/Renderer.ts', renderer);

// Base URL makes the static build work both at / and GitHub Pages project paths.
let html = read('web/index.html');
html = replaceOnce(html, '  <meta charset="UTF-8" />\n', '  <meta charset="UTF-8" />\n  <base href="/" />\n', 'base tag');
html = html.replace('href="/style.css"', 'href="style.css"').replace('href="/editor.css"', 'href="editor.css"')
  .replace('"@bobby/engine":"/engine/index.js","@bobby/editor":"/editor/index.js"', '"@bobby/engine":"engine/index.js","@bobby/editor":"editor/index.js"')
  .replace('src="/app.js"', 'src="app.js"');
write('web/index.html', html);

let main = read('web/src/main.ts');
main = main.replaceAll('/assets/', 'assets/');
main = main.replaceAll('href="/', 'href="');
main = replaceOnce(main,
`function navigate(path: string): void {\n  history.pushState(null, '', path);\n  void renderRoute();\n}`,
`function navigate(path: string): void {\n  const target = new URL(path.replace(/^\\/+/, ''), document.baseURI);\n  history.pushState(null, '', \`${'${target.pathname}${target.search}${target.hash}'}\`);\n  void renderRoute();\n}`,'base-aware navigate');
main = replaceOnce(main,
`        <span class="hud-chip" title="本次游玩时间">⏱ <strong id="hud-time">00:00</strong></span>\n        <span class="hud-chip" title="剩余主要目标">🥕 <strong id="hud-objectives">—</strong></span>`,
`        <span class="hud-chip" title="本次游玩时间"><strong id="hud-time">00:00</strong></span>\n        <span class="hud-chip" title="剩余主要目标"><span class="hud-art hud-carrot" aria-hidden="true"></span><strong id="hud-objectives">—</strong></span>`, 'hud time/objective');
main = replaceOnce(main,
`        <span class="hud-chip step-chip" title="移动步数">👣 <strong id="hud-moves">0</strong></span>`,
`        <span class="hud-chip step-chip" title="移动步数"><strong id="hud-moves">0</strong><span class="hud-text-label">STEPS</span></span>`, 'hud moves');
main = replaceOnce(main,
`      <canvas id="game"></canvas>\n      <div id="status" class="game-status">正在载入关卡…</div>`,
`      <canvas id="game"></canvas>\n      <div class="mobile-dpad" aria-label="移动方向"><button data-move="up">↑</button><button data-move="left">←</button><button data-move="down">↓</button><button data-move="right">→</button></div>\n      <aside id="debug-panel" class="debug-panel" aria-live="polite"></aside>\n      <div id="status" class="game-status">正在载入关卡…</div>`, 'game mobile/debug controls');
main = main.replace('        <p>触屏 Swipe：移动一格。</p>\n        <p>鼠标滚轮 / 双指 Pinch：放大缩小。</p>\n        <p><kbd>~</kbd>：DEBUG。开启后点击地图格，调试信息会显示在左下角状态栏。</p>',
`        <p>手机方向键：按住连续移动；抬起后当前格结束即停。</p>\n        <p>鼠标/单指拖动地图；鼠标滚轮 / 双指 Pinch：放大缩小。</p>\n        <p><kbd>~</kbd>：DEBUG。开启后地图显示格线，点击格子后右侧显示详情。</p>`);
main = replaceOnce(main,
`  const gameResult = document.querySelector<HTMLDivElement>('#game-result');`,
`  const debugPanel = document.querySelector<HTMLElement>('#debug-panel');\n  const gameResult = document.querySelector<HTMLDivElement>('#game-result');`, 'debug panel query');
main = main.replace('  if (!canvas || !status || !gameResult || !resultCard || !hudTime || !hudObjectives || !hudMoves || !hudItems) throw new Error(\'Game UI failed to mount\');',
`  if (!canvas || !status || !debugPanel || !gameResult || !resultCard || !hudTime || !hudObjectives || !hudMoves || !hudItems) throw new Error('Game UI failed to mount');`);
main = main.replaceAll("mowerBobbyUrl: 'assets/art/hd/b7.png', kiteUrl: 'assets/art/hd/b9.png', sourceTileSize: 48", "mowerBobbyUrl: 'assets/art/hd/b7.png', idleBobbyUrl: 'assets/art/hd/b4.png', deathBobbyUrl: 'assets/art/hd/b5.png', kiteUrl: 'assets/art/hd/b9.png', sourceTileSize: 48");
main = main.replaceAll("mowerBobbyUrl:'assets/art/hd/b7.png', kiteUrl:'assets/art/hd/b9.png', sourceTileSize:48", "mowerBobbyUrl:'assets/art/hd/b7.png', idleBobbyUrl:'assets/art/hd/b4.png', deathBobbyUrl:'assets/art/hd/b5.png', kiteUrl:'assets/art/hd/b9.png', sourceTileSize:48");
main = replaceOnce(main,
`  activeInput = new InputController(activeGame);\n  await activeGame.loadLevel(level);`,
`  activeInput = new InputController(activeGame);\n  bindMobileControls(activeGame);\n  await activeGame.loadLevel(level);`, 'bind controls official');
main = main.replace(`    if (world.state.profile.superKey) items.push('<span class="item-chip" title="Super Key">🔑+</span>');\n    else if (world.state.profile.temporaryKey) items.push('<span class="item-chip" title="本关钥匙">🔑</span>');\n    if (world.state.inventory.gas) items.push('<span class="item-chip" title="汽油">⛽</span>');\n    if (world.state.inventory.shovel) items.push('<span class="item-chip" title="雪铲">🛠</span>');\n    if (world.state.inventory.kite) items.push('<span class="item-chip" title="风筝">◇</span>');\n    if (world.state.inventory.beans > 0) items.push(\`<span class="item-chip" title="魔豆">🌱\${world.state.inventory.beans}</span>\`);\n    if (world.state.goldenCarrotsInLevel > 0) items.push(\`<span class="item-chip" title="本关金胡萝卜">🥕★\${world.state.goldenCarrotsInLevel}</span>\`);\n    if (world.state.bonusCoinsInLevel > 0) items.push(\`<span class="item-chip" title="本关 Bonus Coin">●\${world.state.bonusCoinsInLevel}</span>\`);\n    if (world.state.bonusTimeRemainingMs !== null) items.push(\`<span class="item-chip bonus-time" title="Bonus 剩余时间">⌛\${Math.ceil(world.state.bonusTimeRemainingMs / 1000)}s</span>\`);`,
`    if (world.state.profile.superKey || world.state.profile.temporaryKey) items.push('<span class="item-chip" title="钥匙"><span class="hud-art hud-key" aria-hidden="true"></span></span>');\n    if (world.state.inventory.gas) items.push('<span class="item-chip" title="汽油"><span class="hud-art hud-gas" aria-hidden="true"></span></span>');\n    if (world.state.inventory.shovel) items.push('<span class="item-chip" title="雪铲"><span class="hud-art hud-shovel" aria-hidden="true"></span></span>');\n    if (world.state.inventory.kite) items.push('<span class="item-chip" title="风筝"><span class="hud-art hud-kite" aria-hidden="true"></span></span>');\n    if (world.state.inventory.beans > 0) items.push(\`<span class="item-chip" title="魔豆"><span class="hud-art hud-bean" aria-hidden="true"></span><strong>\${world.state.inventory.beans}</strong></span>\`);\n    if (world.state.goldenCarrotsInLevel > 0) items.push(\`<span class="item-chip" title="本关金胡萝卜"><img class="hud-golden-carrot" src="assets/art/hd/icon.png" alt=""><strong>\${world.state.goldenCarrotsInLevel}</strong></span>\`);\n    if (world.state.bonusCoinsInLevel > 0) items.push(\`<span class="item-chip" title="本关 Bonus Coin">BONUS <strong>\${world.state.bonusCoinsInLevel}</strong></span>\`);\n    if (world.state.bonusTimeRemainingMs !== null) items.push(\`<span class="item-chip bonus-time" title="Bonus 剩余时间"><strong>\${Math.ceil(world.state.bonusTimeRemainingMs / 1000)}s</strong></span>\`);`);
main = replaceOnce(main,
`    if (activeGame.debug && debugInspection) {\n      status.textContent = debugInspection;\n      status.classList.add('debug');\n    } else {\n      status.classList.remove('debug');\n      const move = activeGame.lastMove;\n      status.textContent = activeGame.debug\n        ? 'DEBUG · 点击地图格查看 Terrain / Object / Dynamic 状态'\n        : move ? \`${'${move.moved ? \'移动\' : \'阻挡\'} · ${move.passage.reason}'}\` : \`${'${displayLevelId(meta)} · 准备就绪'}\`;\n    }`,
`    debugPanel.classList.toggle('visible', activeGame.debug);\n    debugPanel.textContent = activeGame.debug ? (debugInspection ?? 'DEBUG\\n点击地图格查看详情') : '';\n    status.classList.remove('debug');\n    const move = activeGame.lastMove;\n    status.textContent = move ? \`${'${move.moved ? \'移动\' : \'阻挡\'} · ${move.passage.reason}'}\` : \`${'${displayLevelId(meta)} · 准备就绪'}\`;`, 'debug update');
main = main.replace(`  activeGame.on('debug-change', () => { if (!activeGame?.debug) debugInspection = null; update(); });`, `  activeGame.on('debug-change', () => { if (!activeGame?.debug) debugInspection = null; update(); });`);
main = replaceOnce(main,
`  canvas.addEventListener('click', (event) => {\n    if (!activeGame?.debug) return;\n    const tile: TileInspection | null = activeGame.inspectCanvasPoint(event.clientX, event.clientY);\n    debugInspection = tile ? formatTileInspection(tile) : 'DEBUG · 地图外';\n    update();\n  });`,
`  canvas.addEventListener('click', (event) => {\n    if (!activeGame?.debug || activeInput?.consumePointerClickSuppression()) return;\n    const tile: TileInspection | null = activeGame.inspectCanvasPoint(event.clientX, event.clientY);\n    debugInspection = tile ? formatTileInspection(tile, activeGame) : 'DEBUG\\n地图外';\n    update();\n  });`, 'debug click');
main = replaceOnce(main,
`function formatTileInspection(tile: TileInspection): string {\n  const dynamic = tile.dynamicEntity ? \` · Dynamic \${tile.dynamicEntity.type}\` : '';\n  return \`DEBUG \${tile.x},\${tile.y} · Terrain \${tile.terrainType} · Object \${tile.object ? tile.objectType : 'empty'}\${dynamic}\${tile.isPlayer ? ' · BOBBY' : ''}\`;\n}`,
`function formatTileInspection(tile: TileInspection, game: Game): string {\n  const world = game.world;\n  const dynamic = tile.dynamicEntity;\n  return [\n    \`Tile (\${tile.x}, \${tile.y})\`,\n    \`Terrain: \${tile.terrainType}\`,\n    \`Object: \${tile.object ? tile.objectType : 'empty'}\`,\n    dynamic ? \`Dynamic: \${dynamic.type}\` : 'Dynamic: none',\n    dynamic ? \`  direction: \${dynamic.direction ?? 'none'}\` : '',\n    dynamic ? \`  rider: \${dynamic.rider} · settled: \${dynamic.settled}\` : '',\n    dynamic ? \`  offsetPx: \${dynamic.offsetXpx}, \${dynamic.offsetYpx}\` : '',\n    \`Flags: player=\${tile.isPlayer} · start=\${tile.isStart}\`,\n    '',\n    \`Bobby: (\${world.player.x}, \${world.player.y}) · facing=\${world.facing}\`,\n    \`Forced: \${world.forcedKind ?? 'none'} / \${world.forcedDirection ?? 'none'}\`,\n    \`Mower: \${world.ridingMower}\`,\n    \`Objectives: \${world.objectiveRemaining}/\${world.objectiveTotal}\`,\n    \`Moves: \${world.state.moves}\`,\n    \`Inventory: gas=\${world.state.inventory.gas} kite=\${world.state.inventory.kite} shovel=\${world.state.inventory.shovel} beans=\${world.state.inventory.beans}\`,\n    game.lastMove ? \`Last passage: \${game.lastMove.passage.reason} [\${game.lastMove.passage.confidence}]\` : 'Last passage: none'\n  ].filter(Boolean).join('\\n');\n}\n\nfunction bindMobileControls(game: Game): void {\n  document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {\n    const direction = button.dataset.move as 'up' | 'down' | 'left' | 'right';\n    const press = (event: PointerEvent): void => {\n      event.preventDefault();\n      button.setPointerCapture(event.pointerId);\n      game.setHeldDirection(direction);\n    };\n    const release = (event: PointerEvent): void => {\n      event.preventDefault();\n      game.setHeldDirection(null);\n    };\n    button.addEventListener('pointerdown', press);\n    button.addEventListener('pointerup', release);\n    button.addEventListener('pointercancel', release);\n    button.addEventListener('lostpointercapture', () => game.setHeldDirection(null));\n  });\n}`, 'rich inspection and dpad binder');
main = main.replace(`    shareOrigin: location.origin, onClose: () => navigate('/levels')`, `    shareOrigin: new URL('.', document.baseURI).href.replace(/\\/$/, ''), onClose: () => navigate('/levels')`);
main = replaceOnce(main,
`    <main class="game-stage"><canvas id="game"></canvas><div id="status" class="game-status">正在载入分享地图…</div><div id="game-result" class="game-result" hidden><section class="result-card"></section></div></main>`,
`    <main class="game-stage"><canvas id="game"></canvas><div class="mobile-dpad" aria-label="移动方向"><button data-move="up">↑</button><button data-move="left">←</button><button data-move="down">↓</button><button data-move="right">→</button></div><div id="status" class="game-status">正在载入分享地图…</div><div id="game-result" class="game-result" hidden><section class="result-card"></section></div></main>`, 'shared dpad');
main = replaceOnce(main,
`  activeInput = new InputController(activeGame);\n  await activeGame.loadLevel(level);\n\n  const update = (): void => {`,
`  activeInput = new InputController(activeGame);\n  bindMobileControls(activeGame);\n  await activeGame.loadLevel(level);\n\n  const update = (): void => {`, 'bind controls shared');
main = main.replace('WASD / 方向键 / Swipe / Wheel / Pinch / ~ DEBUG', 'WASD / 方向键 / Drag / Wheel / Pinch / ~ DEBUG');
main = replaceOnce(main,
`  document.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((anchor) => {\n    anchor.addEventListener('click', (event) => { event.preventDefault(); navigate(new URL(anchor.href).pathname); });\n  });`,
`  document.querySelectorAll<HTMLAnchorElement>('a[data-nav]').forEach((anchor) => {\n    anchor.addEventListener('click', (event) => { event.preventDefault(); navigate(anchor.getAttribute('href') ?? '/'); });\n  });`, 'base-aware nav binding');
main = replaceOnce(main,
`  const path = location.pathname.replace(/\\/+$/, '') || '/';`,
`  const basePath = new URL(document.baseURI).pathname.replace(/\\/+$/, '');\n  const localPath = basePath && basePath !== '/' && location.pathname.startsWith(basePath) ? location.pathname.slice(basePath.length) : location.pathname;\n  const path = localPath.replace(/\\/+$/, '') || '/';`, 'strip pages base');
write('web/src/main.ts', main);

let css = read('web/style.css');
css += `\n/* Requested mobile controls, original HUD art and debug inspector */\n.hud-art{display:inline-block;position:relative;height:38px;overflow:hidden;flex:0 0 auto;background-image:url("assets/art/hd/hud.png");background-repeat:no-repeat;background-size:350px 38px}\n.hud-carrot{width:39px;background-position:-42px 0}.hud-gas{width:37px;background-position:-83px 0}.hud-key{width:20px;background-position:-122px 0}.hud-kite{width:35px;background-position:-144px 0}.hud-shovel{width:37px;background-position:-179px 0}.hud-egg{width:29px;background-position:-217px 0}.hud-bean{width:35px;background-position:-247px 0}\n.hud-golden-carrot{display:block;max-height:32px;width:auto}.hud-text-label{font-size:.58rem;color:var(--muted);letter-spacing:.08em}.hud-chip:has(.hud-art),.item-chip:has(.hud-art){height:42px;padding-top:1px;padding-bottom:1px}\n.mobile-dpad{display:none}.debug-panel{z-index:6;line-height:1.45;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}\n@media(max-width:700px){\n  .game-page{height:100dvh}\n  .game-toolbar #edit-level{display:none!important}\n  .mobile-dpad{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(2,52px);gap:5px;z-index:7;touch-action:none}\n  .mobile-dpad button{border:1px solid #ffffff35;background:#0b140ecf;color:#eef5ef;border-radius:14px;font-size:1.35rem;backdrop-filter:blur(8px);touch-action:none;user-select:none;-webkit-user-select:none}\n  .mobile-dpad button[data-move=up]{grid-column:2;grid-row:1}.mobile-dpad button[data-move=left]{grid-column:1;grid-row:2}.mobile-dpad button[data-move=down]{grid-column:2;grid-row:2}.mobile-dpad button[data-move=right]{grid-column:3;grid-row:2}\n  .game-status{right:190px;max-width:none}\n  .debug-panel{left:12px;right:12px;top:12px;width:auto;max-height:46%}\n}\n`;
write('web/style.css', css);

// Pages deploy action; base tag is rewritten to the repository Pages base path after build.
fs.mkdirSync(path.join(root, '.github/workflows'), { recursive: true });
write('.github/workflows/pages.yml', `name: pages\n\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: pages\n  cancel-in-progress: true\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: npm\n      - uses: actions/configure-pages@v5\n        id: pages\n      - run: npm ci\n      - run: npm run verify\n      - name: Prepare GitHub Pages base path\n        env:\n          PAGES_BASE: \\${{ steps.pages.outputs.base_path }}\n        run: |\n          node - <<'NODE'\n          const fs = require('fs');\n          const path = require('path');\n          const root = 'dist/web';\n          const base = (process.env.PAGES_BASE || '').replace(/\\/$/, '') + '/';\n          for (const entry of fs.readdirSync(root, { recursive: true })) {\n            if (!entry.endsWith('.html')) continue;\n            const file = path.join(root, entry);\n            const text = fs.readFileSync(file, 'utf8').replace('<base href="/" />', '<base href="' + base + '" />');\n            fs.writeFileSync(file, text);\n          }\n          fs.writeFileSync(path.join(root, '.nojekyll'), '');\n          NODE\n      - uses: actions/upload-pages-artifact@v3\n        with:\n          path: dist/web\n\n  deploy:\n    environment:\n      name: github-pages\n      url: \\${{ steps.deployment.outputs.page_url }}\n    runs-on: ubuntu-latest\n    needs: build\n    steps:\n      - name: Deploy to GitHub Pages\n        id: deployment\n        uses: actions/deploy-pages@v4\n`);

console.log('Applied requested UI/mobile/debug/pages changes.');
