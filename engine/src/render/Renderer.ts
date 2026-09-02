import type { ImageManager } from "../image/ImageManager.js";
import type {
  AtlasVisualLayer,
  ImageVisualLayer,
  VisualComposition,
} from "../visual/VisualDefinition.js";
import type { CellPosition } from "../world/entity/EntityInstance.js";
import type { Camera } from "./Camera.js";
import type { RenderItem, RenderScene } from "./RenderScene.js";

export interface RenderViewport {
  width: number;
  height: number;
}

interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 纯绘制器：不读取 World、不解析 EntityDefinition、不选择视觉、不加载图片。 */
export class Renderer {
  private readonly context: CanvasRenderingContext2D | null;
  private debug = false;
  private debugSelection: CellPosition | null = null;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly images: ImageManager,
  ) {
    this.context = canvas.getContext("2d");
  }

  async load(): Promise<void> {
    await this.images.preload();
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

  setDebugSelection(cell: CellPosition | null): void {
    this.debugSelection = cell ? { ...cell } : null;
  }

  render(scene: RenderScene, camera: Camera, viewport = this.measureViewport()): void {
    const context = this.context;
    if (!context) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(viewport.width * dpr);
    const pixelHeight = Math.round(viewport.height * dpr);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#07100b";
    context.fillRect(0, 0, viewport.width, viewport.height);

    this.drawPass(context, scene.world, camera, dpr);
    this.drawPass(context, scene.player, camera, dpr);
    this.drawPass(context, scene.effect, camera, dpr);

    if (this.debug) {
      this.drawDebugGrid(context, scene.worldWidth, scene.worldHeight, camera);
      this.drawDebugSelection(context, camera);
    }
  }

  private drawPass(
    context: CanvasRenderingContext2D,
    items: readonly RenderItem[],
    camera: Camera,
    dpr: number,
  ): void {
    for (const item of items)
      this.drawComposition(
        context,
        item.composition,
        item.visualX,
        item.visualY,
        camera,
        dpr,
      );
  }

  private drawComposition(
    context: CanvasRenderingContext2D,
    composition: VisualComposition,
    x: number,
    y: number,
    camera: Camera,
    dpr: number,
  ): void {
    const point = camera.worldToScreen(x, y);
    const size = camera.tileScreenSize;
    const cell = snapRectToDevicePixels(
      point.x,
      point.y,
      point.x + size,
      point.y + size,
      dpr,
    );
    for (const layer of composition.layers) {
      if (layer.kind === "canvas") {
        layer.draw(context, cell.x, cell.y, Math.min(cell.width, cell.height));
      } else if (layer.kind === "image") {
        this.drawImageLayer(context, layer, cell, size, camera, dpr);
      } else {
        this.drawAtlasLayer(context, layer, cell, camera);
      }
    }
  }

  private drawImageLayer(
    context: CanvasRenderingContext2D,
    layer: ImageVisualLayer,
    cell: PixelRect,
    size: number,
    camera: Camera,
    dpr: number,
  ): void {
    const image = this.images.image(layer.asset);
    if (!image) return;
    const requestedColumns = positiveInteger(layer.frameColumns);
    const requestedRows = positiveInteger(layer.frameRows);
    const frameWidth = Math.max(
      1,
      layer.frameWidth ?? image.width / (requestedColumns ?? 1),
    );
    const frameHeight = Math.max(
      1,
      layer.frameHeight ?? image.height / (requestedRows ?? 1),
    );
    const columns =
      requestedColumns ?? Math.max(1, Math.floor(image.width / frameWidth));
    const rows =
      requestedRows ?? Math.max(1, Math.floor(image.height / frameHeight));
    const frameCount = Math.max(1, columns * rows);
    const progress = Math.max(0, Math.min(0.999999, layer.frameProgress ?? 0));
    const requestedFrame = layer.frameIndex ?? Math.floor(progress * frameCount);
    const frame = Math.max(0, Math.min(frameCount - 1, requestedFrame));
    const sourceX = (frame % columns) * frameWidth;
    const sourceY = Math.floor(frame / columns) * frameHeight;

    if (layer.anchor === "fill") {
      context.drawImage(
        image,
        sourceX,
        sourceY,
        frameWidth,
        frameHeight,
        cell.x,
        cell.y,
        cell.width,
        cell.height,
      );
      return;
    }

    const scale = size / camera.sourceTileSize;
    const drawWidth = frameWidth * scale;
    const drawHeight = frameHeight * scale;
    const drawX =
      cell.x + cell.width / 2 - drawWidth / 2 + (layer.offsetX ?? 0) * scale;
    const drawY =
      (layer.anchor === "center"
        ? cell.y + cell.height / 2 - drawHeight / 2
        : cell.y + cell.height - drawHeight) + (layer.offsetY ?? 0) * scale;
    const drawRect = snapRectToDevicePixels(
      drawX,
      drawY,
      drawX + drawWidth,
      drawY + drawHeight,
      dpr,
    );
    context.drawImage(
      image,
      sourceX,
      sourceY,
      frameWidth,
      frameHeight,
      drawRect.x,
      drawRect.y,
      drawRect.width,
      drawRect.height,
    );
  }

  private drawAtlasLayer(
    context: CanvasRenderingContext2D,
    layer: AtlasVisualLayer,
    cell: PixelRect,
    camera: Camera,
  ): void {
    const atlas = this.images.image(this.images.atlasId);
    if (!atlas) return;
    context.save();
    context.translate(cell.x + cell.width / 2, cell.y + cell.height / 2);
    context.rotate((layer.rotate ?? 0) * Math.PI / 2);
    context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
    const source = camera.sourceTileSize;
    context.drawImage(
      atlas,
      layer.column * source,
      layer.row * source,
      source,
      source,
      -cell.width / 2,
      -cell.height / 2,
      cell.width,
      cell.height,
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

  private drawDebugSelection(
    context: CanvasRenderingContext2D,
    camera: Camera,
  ): void {
    const cell = this.debugSelection;
    if (!cell) return;
    const point = camera.worldToScreen(cell.x, cell.y);
    const size = camera.tileScreenSize;
    context.save();
    context.fillStyle = "rgba(74, 168, 255, .16)";
    context.strokeStyle = "rgba(118, 196, 255, .95)";
    context.lineWidth = 2;
    context.fillRect(point.x, point.y, size, size);
    context.strokeRect(point.x + 1, point.y + 1, size - 2, size - 2);
    context.restore();
  }
}

function snapRectToDevicePixels(
  left: number,
  top: number,
  right: number,
  bottom: number,
  dpr: number,
): PixelRect {
  const snappedLeft = Math.round(left * dpr) / dpr;
  const snappedTop = Math.round(top * dpr) / dpr;
  const snappedRight = Math.round(right * dpr) / dpr;
  const snappedBottom = Math.round(bottom * dpr) / dpr;
  return {
    x: snappedLeft,
    y: snappedTop,
    width: snappedRight - snappedLeft,
    height: snappedBottom - snappedTop,
  };
}

function positiveInteger(value: number | undefined): number | null {
  if (!Number.isFinite(value) || (value ?? 0) < 1) return null;
  return Math.max(1, Math.floor(value!));
}
