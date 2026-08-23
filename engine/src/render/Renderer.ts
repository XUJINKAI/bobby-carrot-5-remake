import { Camera } from './Camera.js';
import { ObjectId, type Direction } from '../mechanics/ids.js';
import { animatedObjectTile, animatedTerrainTile } from './animation.js';
import type { World } from '../world/World.js';

export interface RendererAssets {
  atlasUrl: string;
  /** 原版动态格动画图集 ta.png（高清版为 4×15 个 48px 单元）。 */
  animationAtlasUrl?: string;
  /** 兼容旧调用：不提供 bobbyUrls 时作为向右/默认 sprite。 */
  bobbyUrl?: string;
  bobbyUrls?: Partial<Record<Direction, string>>;
  kiteUrl?: string;
  mowerBobbyUrl?: string;
  sourceTileSize?: number;
}

export interface VisualPlayerState {
  x: number;
  y: number;
  direction: Direction;
  progress: number;
  moving: boolean;
  /** 当前动画中 Bobby 与动态载具是否共享同一条像素插值轨迹。 */
  ridingDynamic: boolean;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载图片 ${url}`));
    image.src = url;
  });
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly camera: Camera;
  private readonly context: CanvasRenderingContext2D;
  private atlas: HTMLImageElement | null = null;
  private animationAtlas: HTMLImageElement | null = null;
  private readonly bobby = new Map<Direction, HTMLImageElement>();
  private kite: HTMLImageElement | null = null;
  private mowerBobby: HTMLImageElement | null = null;
  private debug = false;
  private readonly sourceTileSize: number;
  private loaded = false;
  private readonly animationStartedAt = performance.now();

  constructor(canvas: HTMLCanvasElement, assets: RendererAssets) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context 不可用');
    this.canvas = canvas;
    this.context = context;
    this.sourceTileSize = assets.sourceTileSize ?? 48;
    this.camera = new Camera(this.sourceTileSize);
    void this.load(assets);
  }

  async load(assets: RendererAssets): Promise<void> {
    const fallback = assets.bobbyUrl ?? assets.bobbyUrls?.right ?? '';
    const urls: Record<Direction, string> = {
      right: assets.bobbyUrls?.right ?? fallback,
      left: assets.bobbyUrls?.left ?? fallback,
      up: assets.bobbyUrls?.up ?? fallback,
      down: assets.bobbyUrls?.down ?? fallback
    };
    const [atlas, animationAtlas, right, left, up, down, kite, mower] = await Promise.all([
      loadImage(assets.atlasUrl),
      assets.animationAtlasUrl ? loadImage(assets.animationAtlasUrl) : Promise.resolve(null),
      loadImage(urls.right), loadImage(urls.left), loadImage(urls.up), loadImage(urls.down),
      assets.kiteUrl ? loadImage(assets.kiteUrl) : Promise.resolve(null),
      assets.mowerBobbyUrl ? loadImage(assets.mowerBobbyUrl) : Promise.resolve(null)
    ]);
    this.atlas = atlas;
    this.animationAtlas = animationAtlas;
    this.bobby.set('right', right);
    this.bobby.set('left', left);
    this.bobby.set('up', up);
    this.bobby.set('down', down);
    this.kite = kite;
    this.mowerBobby = mower;
    this.loaded = true;
  }

  get ready(): boolean { return this.loaded && this.atlas !== null && this.bobby.size === 4; }
  setDebug(value: boolean): void { this.debug = value; }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.camera.setViewport(rect.width, rect.height);
  }

  render(world: World, visualPlayer: VisualPlayerState): void {
    this.resize();
    const ctx = this.context;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.camera.viewportWidth, this.camera.viewportHeight);
    ctx.fillStyle = '#102118';
    ctx.fillRect(0, 0, this.camera.viewportWidth, this.camera.viewportHeight);

    if (!this.ready || !this.atlas) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px system-ui';
      ctx.fillText('正在加载 Bobby 美术资源…', 18, 28);
      return;
    }

    const riddenForCamera = world.getRiddenDynamicEntity();
    const cameraPlayer = visualPlayer.moving
      ? visualPlayer
      : {
          x: world.player.x + (riddenForCamera?.offsetXpx ?? 0) / this.sourceTileSize,
          y: world.player.y + (riddenForCamera?.offsetYpx ?? 0) / this.sourceTileSize
        };
    this.camera.follow(cameraPlayer, world.width, world.height);
    const size = this.camera.tileScreenSize;
    const atlas = this.atlas;
    const visibleCols = Math.ceil(this.camera.viewportWidth / size) + 3;
    const visibleRows = Math.ceil(this.camera.viewportHeight / size) + 3;
    const topLeft = this.camera.screenToTile(-size, -size);
    const maxX = Math.min(world.width, topLeft.x + visibleCols);
    const maxY = Math.min(world.height, topLeft.y + visibleRows);
    const animationElapsed = performance.now() - this.animationStartedAt;

    for (let y = Math.max(0, topLeft.y); y < maxY; y += 1) {
      for (let x = Math.max(0, topLeft.x); x < maxX; x += 1) {
        const terrain = world.terrainAt(x, y);
        if (terrain === null) continue;
        const screen = this.camera.worldToScreen(x, y);
        const animatedTerrain = this.animationAtlas ? animatedTerrainTile(terrain, world.state, animationElapsed) : null;
        if (animatedTerrain && this.animationAtlas) this.drawAnimationTile(this.animationAtlas, animatedTerrain.taIndex, screen.x, screen.y, size);
        else this.drawAtlasTile(atlas, terrain, screen.x, screen.y, size);

        const object = world.objectIdAt(x, y);
        if (object !== ObjectId.EMPTY) {
          const animatedObject = this.animationAtlas ? animatedObjectTile(object, world.state, animationElapsed) : null;
          if (animatedObject && this.animationAtlas) this.drawAnimationTile(this.animationAtlas, animatedObject.taIndex, screen.x, screen.y, size);
          else this.drawAtlasTile(atlas, object, screen.x, screen.y, size);
        }
        if (this.debug) {
          ctx.strokeStyle = 'rgba(255,255,255,.18)';
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(screen.x) + 0.5, Math.round(screen.y) + 0.5, Math.round(size) - 1, Math.round(size) - 1);
          if (size >= 26) {
            ctx.fillStyle = 'rgba(0,0,0,.55)';
            ctx.fillRect(screen.x + 2, screen.y + 2, Math.min(size - 4, 42), 14);
            ctx.fillStyle = '#fff';
            ctx.font = '10px ui-monospace,monospace';
            ctx.fillText(terrain.toString(16).toUpperCase().padStart(2, '0'), screen.x + 5, screen.y + 12);
          }
        }
      }
    }

    // 动态云与荷叶不在静态 cv[][] 中，必须单独画。
    for (const entity of world.getDynamicEntities()) {
      // 原版 P() 在 Bobby 搭乘荷叶/云时给载具和人物施加完全相同的像素增量。
      // 逻辑世界会先到目标格，所以只有“本次移动从载具上开始且仍在载具上”时才共用视觉插值。
      const renderX = entity.rider && visualPlayer.ridingDynamic
        ? visualPlayer.x
        : entity.x + entity.offsetXpx / this.sourceTileSize;
      const renderY = entity.rider && visualPlayer.ridingDynamic
        ? visualPlayer.y
        : entity.y + entity.offsetYpx / this.sourceTileSize;
      const screen = this.camera.worldToScreen(renderX, renderY);
      this.drawAtlasTile(atlas, entity.id, screen.x, screen.y, size);
    }

    // 龙火轨迹保留一小段视觉提示；状态变化已经由 World 完成。
    if (world.state.fireTrail.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#ff7a1a';
      for (const cell of world.state.fireTrail) {
        const screen = this.camera.worldToScreen(cell.x, cell.y);
        const r = Math.max(3, size * 0.13);
        ctx.beginPath();
        ctx.arc(screen.x + size / 2, screen.y + size / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    this.drawPlayer(world, visualPlayer, size);
  }

  private drawPlayer(world: World, visual: VisualPlayerState, size: number): void {
    const ctx = this.context;
    const ridden = world.getRiddenDynamicEntity();
    const playerX = visual.moving ? visual.x : world.player.x + (ridden?.offsetXpx ?? 0) / this.sourceTileSize;
    const playerY = visual.moving ? visual.y : world.player.y + (ridden?.offsetYpx ?? 0) / this.sourceTileSize;
    const screen = this.camera.worldToScreen(playerX, playerY);
    const forcedKind = world.forcedKind;

    // 风筝飞行用 b9 原版动画素材；四个大帧按左右/上下近似映射。
    if (forcedKind === 'flight' && this.kite) {
      const frameWidth = this.kite.width / 4;
      const frame = visual.direction === 'left' ? 0 : visual.direction === 'right' ? 1 : visual.direction === 'up' ? 2 : 3;
      const scale = size / this.sourceTileSize;
      const drawWidth = frameWidth * scale;
      const drawHeight = this.kite.height * scale;
      ctx.drawImage(this.kite, frame * frameWidth, 0, frameWidth, this.kite.height, screen.x + size / 2 - drawWidth / 2, screen.y + size - drawHeight, drawWidth, drawHeight);
      return;
    }

    // 驾驶割草机时优先使用 b7。其源图是 4 列×2 行的复合帧，第一行即可覆盖四个方向。
    if (world.ridingMower && this.mowerBobby) {
      const frameWidth = this.mowerBobby.width / 4;
      const frameHeight = this.mowerBobby.height / 2;
      const frame = visual.direction === 'left' ? 0 : visual.direction === 'right' ? 1 : visual.direction === 'up' ? 2 : 3;
      const scale = size / this.sourceTileSize;
      ctx.drawImage(this.mowerBobby, frame * frameWidth, 0, frameWidth, frameHeight, screen.x + size / 2 - frameWidth * scale / 2, screen.y + size - frameHeight * scale, frameWidth * scale, frameHeight * scale);
      return;
    }

    // 原版 bj 标志：站在 CE/DE/EE 藤蔓段时强制用 b2（背面/向上）人物动画。
    const spriteDirection: Direction = world.isPlayerClimbing ? 'up' : visual.direction;
    const image = this.bobby.get(spriteDirection) ?? this.bobby.get('down');
    if (!image) return;
    const frameWidth = this.sourceTileSize;
    const frameHeight = image.height;
    const frameCount = Math.max(1, Math.floor(image.width / frameWidth));
    // 静止使用第 0 帧；移动时让 8 帧序列随插值进度走完一次，避免“滑过去”。
    const frame = visual.moving ? Math.min(frameCount - 1, Math.floor(visual.progress * frameCount)) : 0;
    const scale = size / this.sourceTileSize;
    const drawHeight = frameHeight * scale;
    ctx.drawImage(image, frame * frameWidth, 0, frameWidth, frameHeight, screen.x, screen.y + size - drawHeight, size, drawHeight);
  }

  private drawAnimationTile(atlas: HTMLImageElement, index: number, x: number, y: number, size: number): void {
    // ta.png 是 4 列线性动画图集，与 ts.png 的 16×16 ID 图集不同。
    const column = index % 4;
    const row = Math.floor(index / 4);
    this.context.drawImage(atlas, column * this.sourceTileSize, row * this.sourceTileSize, this.sourceTileSize, this.sourceTileSize, x, y, size, size);
  }

  private drawAtlasTile(atlas: HTMLImageElement, id: number, x: number, y: number, size: number): void {
    const column = id & 0x0f;
    const row = id >> 4;
    this.context.drawImage(atlas, column * this.sourceTileSize, row * this.sourceTileSize, this.sourceTileSize, this.sourceTileSize, x, y, size, size);
  }
}
