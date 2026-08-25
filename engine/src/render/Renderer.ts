import { Camera } from "./Camera.js";
import { ObjectId, Terrain, type Direction } from "../mechanics/ids.js";
import type { ObjectType, TerrainType } from "../data/types.js";
import { animatedObjectTile, animatedTerrainTile } from "./animation.js";
import { objectAtlasCell, terrainAtlasCell, type AtlasCell } from "./atlas.js";
import type { World } from "../world/World.js";
import { drawCustomObject, drawCustomTerrain } from "../custom/rendering.js";

export interface RendererAssets {
  atlasUrl: string;
  animationAtlasUrl?: string;
  bobbyUrl?: string;
  bobbyUrls?: Partial<Record<Direction, string>>;
  kiteUrl?: string;
  mowerBobbyUrl?: string;
  idleBobbyUrl?: string;
  deathBobbyUrl?: string;
  sourceTileSize?: number;
}

export interface VisualPlayerState {
  x: number;
  y: number;
  direction: Direction;
  progress: number;
  moving: boolean;
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
  private idleBobby: HTMLImageElement | null = null;
  private deathBobby: HTMLImageElement | null = null;
  private idleSince = performance.now();
  private deathSince: number | null = null;
  private lastPlayerCell = "";
  private debug = false;
  private readonly sourceTileSize: number;
  private loaded = false;
  private readonly animationStartedAt = performance.now();

  constructor(canvas: HTMLCanvasElement, assets: RendererAssets) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context 不可用");
    this.canvas = canvas;
    this.context = context;
    this.sourceTileSize = assets.sourceTileSize ?? 48;
    this.camera = new Camera(this.sourceTileSize);
    void this.load(assets);
  }

  async load(assets: RendererAssets): Promise<void> {
    const fallback = assets.bobbyUrl ?? assets.bobbyUrls?.right ?? "";
    const urls: Record<Direction, string> = {
      right: assets.bobbyUrls?.right ?? fallback,
      left: assets.bobbyUrls?.left ?? fallback,
      up: assets.bobbyUrls?.up ?? fallback,
      down: assets.bobbyUrls?.down ?? fallback,
    };
    const [
      atlas,
      animationAtlas,
      right,
      left,
      up,
      down,
      kite,
      mower,
      idle,
      death,
    ] = await Promise.all([
      loadImage(assets.atlasUrl),
      assets.animationAtlasUrl
        ? loadImage(assets.animationAtlasUrl)
        : Promise.resolve(null),
      loadImage(urls.right),
      loadImage(urls.left),
      loadImage(urls.up),
      loadImage(urls.down),
      assets.kiteUrl ? loadImage(assets.kiteUrl) : Promise.resolve(null),
      assets.mowerBobbyUrl
        ? loadImage(assets.mowerBobbyUrl)
        : Promise.resolve(null),
      assets.idleBobbyUrl
        ? loadImage(assets.idleBobbyUrl)
        : Promise.resolve(null),
      assets.deathBobbyUrl
        ? loadImage(assets.deathBobbyUrl)
        : Promise.resolve(null),
    ]);
    this.atlas = atlas;
    this.animationAtlas = animationAtlas;
    this.bobby.set("right", right);
    this.bobby.set("left", left);
    this.bobby.set("up", up);
    this.bobby.set("down", down);
    this.kite = kite;
    this.mowerBobby = mower;
    this.idleBobby = idle;
    this.deathBobby = death;
    this.loaded = true;
  }

  get ready(): boolean {
    return this.loaded && this.atlas !== null && this.bobby.size === 4;
  }
  setDebug(value: boolean): void {
    this.debug = value;
  }

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
    ctx.fillStyle = "#102118";
    ctx.fillRect(0, 0, this.camera.viewportWidth, this.camera.viewportHeight);

    if (!this.ready || !this.atlas) {
      ctx.fillStyle = "#fff";
      ctx.font = "14px system-ui";
      ctx.fillText("正在加载 Bobby 美术资源…", 18, 28);
      return;
    }

    const riddenForCamera = world.getRiddenDynamicEntity();
    const cameraPlayer = visualPlayer.moving
      ? visualPlayer
      : {
          x:
            world.player.x +
            (riddenForCamera?.offsetXpx ?? 0) / this.sourceTileSize,
          y:
            world.player.y +
            (riddenForCamera?.offsetYpx ?? 0) / this.sourceTileSize,
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
        const animatedTerrain = this.animationAtlas
          ? animatedTerrainTile(terrain, world.state, animationElapsed)
          : null;
        if (animatedTerrain && this.animationAtlas)
          this.drawAnimationTile(
            this.animationAtlas,
            animatedTerrain.taIndex,
            screen.x,
            screen.y,
            size,
          );
        else if (!drawCustomTerrain(ctx, terrain, screen.x, screen.y, size))
          this.drawTerrainTile(atlas, terrain, screen.x, screen.y, size);

        const object = world.objectIdAt(x, y);
        const objectCoveredByGrass =
          terrain === Terrain.HIGH_GRASS ||
          terrain === Terrain.HIGH_GRASS_OBJECTIVE;
        if (object !== ObjectId.EMPTY && !objectCoveredByGrass) {
          const animatedObject = this.animationAtlas
            ? animatedObjectTile(object, world.state, animationElapsed)
            : null;
          if (animatedObject && this.animationAtlas)
            this.drawAnimationTile(
              this.animationAtlas,
              animatedObject.taIndex,
              screen.x,
              screen.y,
              size,
            );
          else if (!drawCustomObject(ctx, object, screen.x, screen.y, size))
            this.drawObjectTile(atlas, object, screen.x, screen.y, size);
        }
        if (this.debug) {
          ctx.strokeStyle = "rgba(255,255,255,.18)";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            Math.round(screen.x) + 0.5,
            Math.round(screen.y) + 0.5,
            Math.round(size) - 1,
            Math.round(size) - 1,
          );
        }
      }
    }

    for (const entity of world.getDynamicEntities()) {
      const renderX =
        entity.rider && visualPlayer.ridingDynamic
          ? visualPlayer.x
          : entity.x + entity.offsetXpx / this.sourceTileSize;
      const renderY =
        entity.rider && visualPlayer.ridingDynamic
          ? visualPlayer.y
          : entity.y + entity.offsetYpx / this.sourceTileSize;
      const screen = this.camera.worldToScreen(renderX, renderY);
      this.drawObjectTile(atlas, entity.type, screen.x, screen.y, size);
    }

    if (world.state.fireTrail.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#ff7a1a";
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

  private drawPlayer(
    world: World,
    visual: VisualPlayerState,
    size: number,
  ): void {
    const ctx = this.context;
    const ridden = world.getRiddenDynamicEntity();
    const playerX = visual.moving
      ? visual.x
      : world.player.x + (ridden?.offsetXpx ?? 0) / this.sourceTileSize;
    const playerY = visual.moving
      ? visual.y
      : world.player.y + (ridden?.offsetYpx ?? 0) / this.sourceTileSize;
    const screen = this.camera.worldToScreen(playerX, playerY);
    const forcedKind = world.forcedKind;
    const now = performance.now();
    const playerCell = `${world.player.x},${world.player.y}`;
    if (
      playerCell !== this.lastPlayerCell ||
      visual.moving ||
      forcedKind ||
      world.ridingMower
    ) {
      this.lastPlayerCell = playerCell;
      this.idleSince = now;
    }

    if (world.dead && this.deathBobby) {
      if (this.deathSince === null) this.deathSince = now;
      this.drawBobbyStrip(
        this.deathBobby,
        screen.x,
        screen.y,
        size,
        Math.min(1, (now - this.deathSince) / 800),
      );
      return;
    }
    this.deathSince = null;

    if (forcedKind === "flight" && this.kite) {
      const frameWidth = this.kite.width / 4;
      const frame =
        visual.direction === "left"
          ? 0
          : visual.direction === "right"
            ? 1
            : visual.direction === "up"
              ? 2
              : 3;
      const scale = size / this.sourceTileSize;
      const drawWidth = frameWidth * scale;
      const drawHeight = this.kite.height * scale;
      ctx.drawImage(
        this.kite,
        frame * frameWidth,
        0,
        frameWidth,
        this.kite.height,
        screen.x + size / 2 - drawWidth / 2,
        screen.y + size - drawHeight,
        drawWidth,
        drawHeight,
      );
      return;
    }

    if (world.ridingMower && this.mowerBobby) {
      const frameWidth = this.mowerBobby.width / 4;
      const frameHeight = this.mowerBobby.height / 2;
      const frame =
        visual.direction === "left"
          ? 0
          : visual.direction === "right"
            ? 1
            : visual.direction === "up"
              ? 2
              : 3;
      const scale = size / this.sourceTileSize;
      ctx.drawImage(
        this.mowerBobby,
        frame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        screen.x + size / 2 - (frameWidth * scale) / 2,
        screen.y + size - frameHeight * scale,
        frameWidth * scale,
        frameHeight * scale,
      );
      return;
    }

    if (
      !visual.moving &&
      !forcedKind &&
      !world.ridingMower &&
      !world.isPlayerClimbing &&
      this.idleBobby &&
      now - this.idleSince >= 5000
    ) {
      const loop = ((now - this.idleSince - 5000) % 900) / 900;
      this.drawBobbyStrip(this.idleBobby, screen.x, screen.y, size, loop);
      return;
    }

    const spriteDirection: Direction = world.isPlayerClimbing
      ? "up"
      : visual.direction;
    const image = this.bobby.get(spriteDirection) ?? this.bobby.get("down");
    if (!image) return;
    const frameWidth = this.sourceTileSize;
    const frameHeight = image.height;
    const frameCount = Math.max(1, Math.floor(image.width / frameWidth));
    const frame = visual.moving
      ? Math.min(frameCount - 1, Math.floor(visual.progress * frameCount))
      : 0;
    const scale = size / this.sourceTileSize;
    const drawHeight = frameHeight * scale;
    ctx.drawImage(
      image,
      frame * frameWidth,
      0,
      frameWidth,
      frameHeight,
      screen.x,
      screen.y + size - drawHeight,
      size,
      drawHeight,
    );
  }

  private drawBobbyStrip(
    image: HTMLImageElement,
    x: number,
    y: number,
    size: number,
    progress: number,
  ): void {
    const frameWidth = this.sourceTileSize;
    const frameHeight = image.height;
    const frameCount = Math.max(1, Math.floor(image.width / frameWidth));
    const frame = Math.min(
      frameCount - 1,
      Math.floor(Math.max(0, Math.min(0.999999, progress)) * frameCount),
    );
    const scale = size / this.sourceTileSize;
    const drawHeight = frameHeight * scale;
    this.context.drawImage(
      image,
      frame * frameWidth,
      0,
      frameWidth,
      frameHeight,
      x,
      y + size - drawHeight,
      size,
      drawHeight,
    );
  }

  private snappedTileRect(
    x: number,
    y: number,
    size: number,
  ): { x: number; y: number; width: number; height: number } {
    const left = Math.floor(x);
    const top = Math.floor(y);
    const right = Math.ceil(x + size);
    const bottom = Math.ceil(y + size);
    return {
      x: left,
      y: top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top),
    };
  }

  private drawAnimationTile(
    atlas: HTMLImageElement,
    index: number,
    x: number,
    y: number,
    size: number,
  ): void {
    const column = index % 4;
    const row = Math.floor(index / 4);
    this.drawAtlasCell(atlas, { column, row }, x, y, size);
  }

  private drawTerrainTile(
    atlas: HTMLImageElement,
    type: TerrainType,
    x: number,
    y: number,
    size: number,
  ): void {
    this.drawAtlasCell(atlas, terrainAtlasCell(type), x, y, size);
  }

  private drawObjectTile(
    atlas: HTMLImageElement,
    type: ObjectType,
    x: number,
    y: number,
    size: number,
  ): void {
    this.drawAtlasCell(atlas, objectAtlasCell(type), x, y, size);
  }

  private drawAtlasCell(
    atlas: HTMLImageElement,
    source: AtlasCell,
    x: number,
    y: number,
    size: number,
  ): void {
    const target = this.snappedTileRect(x, y, size);
    this.context.drawImage(
      atlas,
      source.column * this.sourceTileSize,
      source.row * this.sourceTileSize,
      this.sourceTileSize,
      this.sourceTileSize,
      target.x,
      target.y,
      target.width,
      target.height,
    );
  }
}
