import {
  createBuiltinEntityCatalog,
  ImageManager,
  SpatialVisualQuery,
  visualRegistry as builtinVisualRegistry,
  type AtlasVisualLayer,
  type EntityCatalog,
  type ImageVisualLayer,
  type VisualComposition,
  type VisualRegistry,
} from "@bobby/engine/authoring";
import {
  entityCells,
  resolvePlacement,
  type Cell,
} from "../authoring/entityPlacement.js";
import {
  EditorPreview,
  type EditorPresenceInspection,
} from "../authoring/EditorPreview.js";
import type { PaletteItem } from "../authoring/paletteCatalog.js";
import type { EditorLevel } from "../level/types.js";
import type { EditorViewportState } from "./EditorViewport.js";

export const EDITOR_TILE_SIZE = 38;

export interface EditorCanvasRenderState {
  level: EditorLevel;
  selection: PaletteItem;
  hover: Cell | null;
  replacing: boolean;
  placementSequence: number;
  viewport: Readonly<EditorViewportState>;
}

export class EditorCanvasRenderer {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly images: ImageManager,
    private readonly catalog: EntityCatalog = createBuiltinEntityCatalog(),
    private readonly visuals: VisualRegistry = builtinVisualRegistry,
  ) {}

  async load(): Promise<void> {
    await this.images.preload();
  }

  render(state: EditorCanvasRenderState): void {
    const { level, viewport } = state;
    const cssWidth = level.width * EDITOR_TILE_SIZE;
    const cssHeight = level.height * EDITOR_TILE_SIZE;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.style.transformOrigin = "0 0";
    this.canvas.style.transform = `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    const context = this.canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#09110c";
    context.fillRect(0, 0, cssWidth, cssHeight);

    const preview = new EditorPreview(level, this.catalog);
    const visualQuery = new SpatialVisualQuery(preview.entities, preview.spatial);
    for (let y = 0; y < level.height; y++)
      for (let x = 0; x < level.width; x++)
        for (const inspection of preview.inspectCell(x, y).presences)
          this.drawPresence(context, preview, visualQuery, inspection, x, y);

    this.drawGrid(context, level.width, level.height);
    this.drawPreview(context, state, preview);
  }

  private drawGrid(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    context.strokeStyle = "rgba(255,255,255,.08)";
    context.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      context.beginPath();
      context.moveTo(x * EDITOR_TILE_SIZE, 0);
      context.lineTo(x * EDITOR_TILE_SIZE, height * EDITOR_TILE_SIZE);
      context.stroke();
    }
    for (let y = 0; y <= height; y++) {
      context.beginPath();
      context.moveTo(0, y * EDITOR_TILE_SIZE);
      context.lineTo(width * EDITOR_TILE_SIZE, y * EDITOR_TILE_SIZE);
      context.stroke();
    }
  }

  private drawPreview(
    context: CanvasRenderingContext2D,
    state: EditorCanvasRenderState,
    preview: EditorPreview,
  ): void {
    const { level, hover, selection } = state;
    if (!hover) return;

    const plan = resolvePlacement(
      level,
      this.catalog,
      selection.type,
      hover,
      {},
      {
        placementSequence: state.placementSequence,
        visuals: this.visuals,
      },
    );
    const affected = new Map<string, Cell>();
    const top = preview.inspectCell(hover.x, hover.y).top;
    if (top)
      for (const cell of entityCells(preview, top.ref))
        affected.set(`${cell.x},${cell.y}`, cell);
    if (state.replacing)
      for (const ref of plan.replace)
        for (const cell of entityCells(preview, ref))
          affected.set(`${cell.x},${cell.y}`, cell);

    context.fillStyle = "rgba(90,170,255,.26)";
    for (const cell of affected.values())
      context.fillRect(
        cell.x * EDITOR_TILE_SIZE,
        cell.y * EDITOR_TILE_SIZE,
        EDITOR_TILE_SIZE,
        EDITOR_TILE_SIZE,
      );

    if (plan.valid) {
      const removed = new Set(plan.replace.map((ref) => ref.index));
      const ghostLevel: EditorLevel = {
        ...level,
        entities: [
          ...level.entities.filter((_, index) => !removed.has(index)),
          plan.entity,
        ],
      };
      const ghost = new EditorPreview(ghostLevel, this.catalog);
      const ghostQuery = new SpatialVisualQuery(ghost.entities, ghost.spatial);
      const ghostRef = { index: ghostLevel.entities.length - 1 };
      context.globalAlpha = 0.55;
      for (const inspection of ghost.presencesFor(ghostRef))
        this.drawPresence(
          context,
          ghost,
          ghostQuery,
          inspection,
          inspection.presence.cell.x,
          inspection.presence.cell.y,
        );
      context.globalAlpha = 1;
    }

    context.strokeStyle = plan.valid ? "#99d6ff" : "#ff8e8e";
    context.lineWidth = 2;
    context.strokeRect(
      hover.x * EDITOR_TILE_SIZE + 1,
      hover.y * EDITOR_TILE_SIZE + 1,
      EDITOR_TILE_SIZE - 2,
      EDITOR_TILE_SIZE - 2,
    );
  }

  private drawPresence(
    context: CanvasRenderingContext2D,
    preview: EditorPreview,
    query: SpatialVisualQuery,
    inspection: EditorPresenceInspection,
    x: number,
    y: number,
  ): void {
    const entity = preview.entities.require(inspection.presence.entityId);
    const composition = this.visuals.resolve(inspection.definition, {
      entity,
      presence: inspection.presence,
      query,
    });
    this.drawComposition(context, composition, x, y);
  }

  private drawComposition(
    context: CanvasRenderingContext2D,
    composition: VisualComposition | null,
    x: number,
    y: number,
  ): void {
    if (!composition) return;
    const left = x * EDITOR_TILE_SIZE;
    const top = y * EDITOR_TILE_SIZE;
    for (const layer of composition.layers) {
      if (layer.kind === "canvas") {
        layer.draw(context, left, top, EDITOR_TILE_SIZE);
      } else if (layer.kind === "image") {
        this.drawImageLayer(context, layer, x, y);
      } else {
        this.drawAtlasLayer(context, layer, x, y);
      }
    }
  }

  private drawImageLayer(
    context: CanvasRenderingContext2D,
    layer: ImageVisualLayer,
    x: number,
    y: number,
  ): void {
    const image = this.images.image(layer.asset);
    if (!image) return;
    const left = x * EDITOR_TILE_SIZE;
    const top = y * EDITOR_TILE_SIZE;
    const frameWidth = Math.max(1, layer.frameWidth ?? image.width);
    const frameHeight = Math.max(1, layer.frameHeight ?? image.height);
    const columns = Math.max(1, Math.floor(image.width / frameWidth));
    const rows = Math.max(1, Math.floor(image.height / frameHeight));
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
        left,
        top,
        EDITOR_TILE_SIZE,
        EDITOR_TILE_SIZE,
      );
      return;
    }
    const scale = EDITOR_TILE_SIZE / this.images.sourceTileSize;
    const drawWidth = frameWidth * scale;
    const drawHeight = frameHeight * scale;
    const drawX = left + EDITOR_TILE_SIZE / 2 - drawWidth / 2;
    const drawY =
      layer.anchor === "center"
        ? top + EDITOR_TILE_SIZE / 2 - drawHeight / 2
        : top + EDITOR_TILE_SIZE - drawHeight;
    context.drawImage(
      image,
      sourceX,
      sourceY,
      frameWidth,
      frameHeight,
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
  ): void {
    const atlas = this.images.image(this.images.atlasId);
    if (!atlas) return;
    const sourceTile = this.images.sourceTileSize;
    const centerX = x * EDITOR_TILE_SIZE + EDITOR_TILE_SIZE / 2;
    const centerY = y * EDITOR_TILE_SIZE + EDITOR_TILE_SIZE / 2;
    context.save();
    context.translate(centerX, centerY);
    context.rotate((layer.rotate ?? 0) * (Math.PI / 2));
    context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
    context.drawImage(
      atlas,
      layer.column * sourceTile,
      layer.row * sourceTile,
      sourceTile,
      sourceTile,
      -EDITOR_TILE_SIZE / 2,
      -EDITOR_TILE_SIZE / 2,
      EDITOR_TILE_SIZE,
      EDITOR_TILE_SIZE,
    );
    context.restore();
  }
}
