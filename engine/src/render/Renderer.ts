import type { ImageManager } from "../image/ImageManager.js";
import type { VisualComposition } from "../visual/VisualDefinition.js";
import type { CellPosition } from "../world/entity/EntityInstance.js";
import type { Camera } from "./Camera.js";
import {
  prepareCanvas,
  resolveDevicePixelRatio,
} from "./CanvasPixelGeometry.js";
import type { RenderItem, RenderScene } from "./RenderScene.js";
import { drawVisualComposition } from "./VisualPainter.js";

export interface RenderViewport {
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
    const deviceScale = resolveDevicePixelRatio();
    prepareCanvas(
      this.canvas,
      context,
      viewport.width,
      viewport.height,
      deviceScale,
    );
    context.fillStyle = "#07100b";
    context.fillRect(0, 0, viewport.width, viewport.height);

    this.drawPass(context, scene.world, camera, deviceScale);
    this.drawPass(context, scene.player, camera, deviceScale);
    this.drawPass(context, scene.effect, camera, deviceScale);

    if (this.debug) {
      this.drawDebugGrid(context, scene.worldWidth, scene.worldHeight, camera);
      this.drawDebugSelection(context, camera);
    }
  }

  private drawPass(
    context: CanvasRenderingContext2D,
    items: readonly RenderItem[],
    camera: Camera,
    deviceScale: number,
  ): void {
    for (const item of items)
      this.drawComposition(
        context,
        item.composition,
        item.visualX,
        item.visualY,
        camera,
        deviceScale,
      );
  }

  private drawComposition(
    context: CanvasRenderingContext2D,
    composition: VisualComposition,
    x: number,
    y: number,
    camera: Camera,
    deviceScale: number,
  ): void {
    const point = camera.worldToScreen(x, y);
    drawVisualComposition(
      context,
      this.images,
      composition,
      point.x,
      point.y,
      camera.tileScreenSize,
      deviceScale,
    );
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
