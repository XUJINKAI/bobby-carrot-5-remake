import type {
  AtlasVisualLayer,
  ImageVisualLayer,
  VisualAssetSources,
  VisualComposition,
} from "../visual/VisualDefinition.js";
import type { Camera } from "./Camera.js";
import type { RenderScene } from "./RenderScene.js";

export type RendererAssets = VisualAssetSources;

export interface RenderViewport {
  width: number;
  height: number;
}

/** 纯绘制器：不读取 World、不解析 EntityDefinition、不选择视觉。 */
export class Renderer {
  private atlas: HTMLImageElement | null = null;
  private readonly images = new Map<string, HTMLImageElement>();
  private debug = false;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly assets: RendererAssets,
  ) {}

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

  measureViewport(): RenderViewport {
    const rect = this.canvas.getBoundingClientRect();
    return {
      width: Math.max(1, rect.width || this.canvas.clientWidth || 640),
      height: Math.max(1, rect.height || this.canvas.clientHeight || 480),
    };
  }

  setDebug(value: boolean): void {
    this.debug = value;
  }

  render(scene: RenderScene, camera: Camera, viewport = this.measureViewport()): void {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(viewport.width * dpr);
    this.canvas.height = Math.round(viewport.height * dpr);
    const context = this.canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#07100b";
    context.fillRect(0, 0, viewport.width, viewport.height);

    for (const item of scene.items) {
      this.drawComposition(
        context,
        item.composition,
        item.visualX,
        item.visualY,
        camera,
      );
    }

    if (this.debug)
      this.drawDebugGrid(context, scene.worldWidth, scene.worldHeight, camera);
  }

  private drawComposition(
    context: CanvasRenderingContext2D,
    composition: VisualComposition,
    x: number,
    y: number,
    camera: Camera,
  ): void {
    const point = camera.worldToScreen(x, y);
    const size = camera.tileScreenSize;
    for (const layer of composition.layers) {
      if (layer.kind === "canvas") {
        layer.draw(context, point.x, point.y, size);
      } else if (layer.kind === "image") {
        this.drawImageLayer(context, layer, point.x, point.y, size, camera);
      } else {
        this.drawAtlasLayer(context, layer, point.x, point.y, size, camera);
      }
    }
  }

  private drawImageLayer(
    context: CanvasRenderingContext2D,
    layer: ImageVisualLayer,
    x: number,
    y: number,
    size: number,
    camera: Camera,
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
    const scale = size / camera.sourceTileSize;
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
    camera: Camera,
  ): void {
    if (!this.atlas) return;
    context.save();
    context.translate(x + size / 2, y + size / 2);
    context.rotate((layer.rotate ?? 0) * Math.PI / 2);
    context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
    const source = camera.sourceTileSize;
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
    camera: Camera,
  ): void {
    context.save();
    context.strokeStyle = "rgba(255,255,255,.16)";
    context.lineWidth = 1;
    for (let x = 0; x <= width; x += 1) {
      const a = camera.worldToScreen(x, 0);
      const b = camera.worldToScreen(x, height);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
    for (let y = 0; y <= height; y += 1) {
      const a = camera.worldToScreen(0, y);
      const b = camera.worldToScreen(width, y);
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
