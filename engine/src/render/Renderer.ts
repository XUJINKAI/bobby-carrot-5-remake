import type { EntityInstance } from "../world/entity/EntityInstance.js";
import type { World } from "../world/World.js";
import { visualRegistry } from "../visual/builtin.js";
import type { AtlasVisualLayer, VisualComposition } from "../visual/VisualDefinition.js";
import { Camera } from "./Camera.js";
import { drawEntityTile } from "./entity-art.js";

export interface RendererAssets {
  atlasUrl: string;
  sourceTileSize?: number;
  bobbyUrl?: string;
  bobbyUrls?: unknown;
  animationAtlasUrl?: string;
  kiteUrl?: string;
  mowerBobbyUrl?: string;
  idleBobbyUrl?: string;
  deathBobbyUrl?: string;
}

/** Runtime renderer only consumes Entity/Presence + VisualDefinition. */
export class Renderer {
  readonly camera: Camera;
  private atlas: HTMLImageElement | null = null;
  private debug = false;

  constructor(readonly canvas: HTMLCanvasElement, private readonly assets: RendererAssets) {
    this.camera = new Camera(assets.sourceTileSize ?? 48);
  }

  async load(): Promise<void> {
    if (this.atlas) return;
    const atlas = new Image();
    atlas.src = this.assets.atlasUrl;
    await atlas.decode();
    this.atlas = atlas;
  }

  setDebug(value: boolean): void { this.debug = value; }

  render(world: World): void {
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
    this.camera.follow(world.player, world.width, world.height);

    for (let y = 0; y < world.height; y += 1)
      for (let x = 0; x < world.width; x += 1)
        for (const presence of world.presencesAt({ x, y })) {
          const entity = world.entity(presence.entityId);
          if (!entity) continue;
          const definition = world.registry.require(entity.type);
          const composition = visualRegistry.resolve(definition, {
            entity,
            presence,
            query: world.visualQuery,
          });
          this.drawComposition(context, entity, composition, x, y);
        }

    if (this.debug) this.drawDebugGrid(context, world.width, world.height);
  }

  private drawComposition(context: CanvasRenderingContext2D, entity: Readonly<EntityInstance>, composition: VisualComposition | null, x: number, y: number): void {
    if (!composition) return;
    const point = this.camera.worldToScreen(x, y);
    const size = this.camera.tileScreenSize;
    for (const layer of composition.layers) {
      if (layer.kind === "custom") {
        drawEntityTile(context, entity, point.x, point.y, size);
      } else this.drawAtlasLayer(context, layer, point.x, point.y, size);
    }
  }

  private drawAtlasLayer(context: CanvasRenderingContext2D, layer: AtlasVisualLayer, x: number, y: number, size: number): void {
    if (!this.atlas) return;
    context.save();
    context.translate(x + size / 2, y + size / 2);
    context.rotate((layer.rotate ?? 0) * Math.PI / 2);
    context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
    const source = this.camera.sourceTileSize;
    context.drawImage(this.atlas, layer.column * source, layer.row * source, source, source, -size / 2, -size / 2, size, size);
    context.restore();
  }

  private drawDebugGrid(context: CanvasRenderingContext2D, width: number, height: number): void {
    context.save();
    context.strokeStyle = "rgba(255,255,255,.16)";
    context.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      const a = this.camera.worldToScreen(x, 0);
      const b = this.camera.worldToScreen(x, height);
      context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
    }
    for (let y = 0; y <= height; y++) {
      const a = this.camera.worldToScreen(0, y);
      const b = this.camera.worldToScreen(width, y);
      context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
    }
    context.restore();
  }
}
