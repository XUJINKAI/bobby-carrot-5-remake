import type { EntityInstance } from "../world/entity/EntityInstance.js";
import type { World } from "../world/World.js";
import { visualRegistry } from "../visual/builtin.js";
import type {
  AtlasVisualLayer,
  ImageVisualLayer,
  VisualAssetSources,
  VisualComposition,
} from "../visual/VisualDefinition.js";
import { Camera } from "./Camera.js";
import { drawEntityTile } from "./entity-art.js";
import {
  buildRenderScene,
  type RenderVisualRuntimeState,
} from "./RenderScene.js";

export type RendererAssets = VisualAssetSources;
export type VisualRuntimeState = RenderVisualRuntimeState;

const EMPTY_VISUAL_RUNTIME: VisualRuntimeState = new Map();

export class Renderer {
  readonly camera: Camera;
  private atlas: HTMLImageElement | null = null;
  private readonly images = new Map<string, HTMLImageElement>();
  private debug = false;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly assets: RendererAssets,
  ) {
    this.camera = new Camera(assets.sourceTileSize ?? 48);
  }

  async load(): Promise<void> {
    if (this.atlas) return;
    const [atlas, images] = await Promise.all([
      loadImage(this.assets.atlasUrl),
      Promise.all(
        Object.entries(this.assets.imageUrls ?? {}).map(async ([id, url]) => [
          id,
          await loadImage(url),
        ] as const),
      ),
    ]);
    this.atlas = atlas;
    for (const [id, image] of images) this.images.set(id, image);
  }

  setDebug(value: boolean): void {
    this.debug = value;
  }

  render(world: World, runtime: VisualRuntimeState = EMPTY_VISUAL_RUNTIME): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, rect.width || this.canvas.clientWidth || 640);
    const height = Math.max(1, rect.height || this.canvas.clientHeight || 480);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    const context = this.canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#07100b";
    context.fillRect(0, 0, width, height);
    this.camera.setViewport(width, height);

    const playerRuntime = runtime.get(world.playerId);
    this.camera.follow(
      {
        x: world.player.x + (playerRuntime?.offsetX ?? 0),
        y: world.player.y + (playerRuntime?.offsetY ?? 0),
      },
      world.width,
      world.height,
    );

    for (const item of buildRenderScene(world, visualRegistry, runtime)) {
      this.drawComposition(
        context,
        item.entity,
        item.composition,
        item.visualX,
        item.visualY,
      );
    }

    if (this.debug) this.drawDebugGrid(context, world.width, world.height);
  }

  private drawComposition(
    context: CanvasRenderingContext2D,
    entity: Readonly<EntityInstance>,
    composition: VisualComposition,
    x: number,
    y: number,
  ): void {
    const point = this.camera.worldToScreen(x, y);
    const size = this.camera.tileScreenSize;
    for (const layer of composition.layers) {
      if (layer.kind === "custom") {
        drawEntityTile(context, entity, point.x, point.y, size);
      } else if (layer.kind === "image") {
        this.drawImageLayer(context, layer, point.x, point.y, size);
      } else {
        this.drawAtlasLayer(context, layer, point.x, point.y, size);
      }
    }
  }

  private drawImageLayer(
    context: CanvasRenderingContext2D,
    layer: ImageVisualLayer,
    x: number,
    y: number,
    size: number,
  ): void {
    const image = this.images.get(layer.asset);
    if (!image) return;
    if (layer.anchor === "fill") {
      context.drawImage(image, x, y, size, size);
      return;
    }
    const frameWidth = Math.max(1, layer.frameWidth ?? image.width);
    const frameCount = Math.max(1, Math.floor(image.width / frameWidth));
    const progress = Math.max(0, Math.min(0.999999, layer.frameProgress ?? 0));
    const frame = Math.min(frameCount - 1, Math.floor(progress * frameCount));
    const scale = size / this.camera.sourceTileSize;
    const drawWidth = frameWidth * scale;
    const drawHeight = image.height * scale;
    const drawX = x + size / 2 - drawWidth / 2;
    const drawY =
      layer.anchor === "center"
        ? y + size / 2 - drawHeight / 2
        : y + size - drawHeight;
    context.drawImage(
      image,
      frame * frameWidth,
      0,
      frameWidth,
      image.height,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    );
  }

  private drawAtlasLayer(
    context: CanvasRenderingContext2D,
    layer: AtlasVisualLayer,
    x: number,
    y: number,
    size: number,
  ): void {
    if (!this.atlas) return;
    context.save();
    context.translate(x + size / 2, y + size / 2);
    context.rotate((layer.rotate ?? 0) * Math.PI / 2);
    context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
    const source = this.camera.sourceTileSize;
    context.drawImage(
      this.atlas,
      layer.column * source,
      layer.row * source,
      source,
      source,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    context.restore();
  }

  private drawDebugGrid(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    context.save();
    context.strokeStyle = "rgba(255,255,255,.16)";
    context.lineWidth = 1;
    for (let x = 0; x <= width; x += 1) {
      const a = this.camera.worldToScreen(x, 0);
      const b = this.camera.worldToScreen(x, height);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
    for (let y = 0; y <= height; y += 1) {
      const a = this.camera.worldToScreen(0, y);
      const b = this.camera.worldToScreen(width, y);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
    context.restore();
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  return image.decode().then(() => image);
}
