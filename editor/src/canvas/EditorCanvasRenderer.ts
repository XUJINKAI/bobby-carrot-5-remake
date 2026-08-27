import {
  createBuiltinEntityRegistry,
  drawEntityTile,
  entityAtlasCell,
  type EntityRegistry,
  type LevelEntity,
} from "@bobby/engine";
import {
  entityCells,
  resolvePlacement,
  type Cell,
} from "../authoring/entityPlacement.js";
import { EditorPreview } from "../authoring/EditorPreview.js";
import type { PaletteItem } from "../authoring/paletteCatalog.js";
import type { EditorLevel } from "../level/types.js";
import type { EditorViewportState } from "./EditorViewport.js";

const SOURCE_TILE = 48;
export const EDITOR_TILE_SIZE = 38;

export interface EditorCanvasRenderState {
  level: EditorLevel;
  selection: PaletteItem;
  hover: Cell | null;
  replacing: boolean;
  viewport: Readonly<EditorViewportState>;
}

export class EditorCanvasRenderer {
  private atlas: HTMLImageElement | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly atlasUrl: string,
    private readonly registry: EntityRegistry = createBuiltinEntityRegistry(),
  ) {}

  async load(): Promise<void> {
    const image = new Image();
    image.src = this.atlasUrl;
    await image.decode();
    this.atlas = image;
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

    const preview = new EditorPreview(level, this.registry);
    for (let y = 0; y < level.height; y++)
      for (let x = 0; x < level.width; x++)
        for (const inspection of preview.inspectCell(x, y).presences)
          this.drawEntity(
            context,
            inspection.entity,
            inspection.presence.role,
            x,
            y,
          );

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
      this.registry,
      selection.type,
      hover,
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
      context.globalAlpha = 0.55;
      for (const part of plan.cells)
        this.drawEntity(context, plan.entity, part.role, part.x, part.y);
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

  private drawEntity(
    context: CanvasRenderingContext2D,
    entity: LevelEntity,
    role: string | undefined,
    x: number,
    y: number,
  ): void {
    const screenX = x * EDITOR_TILE_SIZE;
    const screenY = y * EDITOR_TILE_SIZE;
    if (
      drawEntityTile(
        context,
        entity,
        screenX,
        screenY,
        EDITOR_TILE_SIZE,
      )
    )
      return;
    const atlasCell = entityAtlasCell(entity, role);
    if (atlasCell) this.drawAtlasCell(context, atlasCell, x, y);
  }

  private drawAtlasCell(
    context: CanvasRenderingContext2D,
    atlasCell: { column: number; row: number },
    x: number,
    y: number,
  ): void {
    if (!this.atlas) return;
    context.drawImage(
      this.atlas,
      atlasCell.column * SOURCE_TILE,
      atlasCell.row * SOURCE_TILE,
      SOURCE_TILE,
      SOURCE_TILE,
      x * EDITOR_TILE_SIZE,
      y * EDITOR_TILE_SIZE,
      EDITOR_TILE_SIZE,
      EDITOR_TILE_SIZE,
    );
  }
}
