import {
  objectAtlasCell,
  terrainAtlasCell,
  drawCustomObject,
  drawCustomTerrain,
} from "@bobby/engine";
import { intersectingOwners, objectCells, resolveObjectOwner, type Cell } from "../authoring/objectOwners.js";
import { placementCells, placementFits } from "../authoring/objectPlacement.js";
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
    if (this.atlas) {
      for (let y = 0; y < level.height; y++)
        for (let x = 0; x < level.width; x++)
          if (
            !drawCustomTerrain(
              context,
              level.terrain[y]![x]!,
              x * EDITOR_TILE_SIZE,
              y * EDITOR_TILE_SIZE,
              EDITOR_TILE_SIZE,
            )
          )
            this.draw(context, terrainAtlasCell(level.terrain[y]![x]!), x, y);
      for (const object of level.objects)
        for (const cell of objectCells(object))
          if (
            !drawCustomObject(
              context,
              cell.type,
              cell.x * EDITOR_TILE_SIZE,
              cell.y * EDITOR_TILE_SIZE,
              EDITOR_TILE_SIZE,
            )
          )
            this.draw(context, objectAtlasCell(cell.type), cell.x, cell.y);
    }
    this.drawGrid(context, level.width, level.height);
    this.drawPreview(context, state);
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
  ): void {
    const { level, hover, selection } = state;
    if (!hover) return;
    const preview =
      selection.kind === "object" ? placementCells(selection.type, hover) : [];
    const affected = new Map<string, Cell>();
    const owner = resolveObjectOwner(level, hover.x, hover.y);
    if (owner)
      for (const cell of owner.cells) affected.set(`${cell.x},${cell.y}`, cell);
    if (state.replacing)
      for (const old of intersectingOwners(level, preview))
        for (const cell of objectCells(old))
          affected.set(`${cell.x},${cell.y}`, cell);
    context.fillStyle = "rgba(90,170,255,.26)";
    for (const cell of affected.values())
      context.fillRect(
        cell.x * EDITOR_TILE_SIZE,
        cell.y * EDITOR_TILE_SIZE,
        EDITOR_TILE_SIZE,
        EDITOR_TILE_SIZE,
      );
    if (this.atlas) {
      context.globalAlpha = 0.55;
      if (selection.kind === "terrain")
        drawCustomTerrain(
          context,
          selection.type,
          hover.x * EDITOR_TILE_SIZE,
          hover.y * EDITOR_TILE_SIZE,
          EDITOR_TILE_SIZE,
        ) || this.draw(context, terrainAtlasCell(selection.type), hover.x, hover.y);
      else if (placementFits(level, selection.type, hover))
        for (const cell of preview)
          drawCustomObject(
            context,
            cell.type,
            cell.x * EDITOR_TILE_SIZE,
            cell.y * EDITOR_TILE_SIZE,
            EDITOR_TILE_SIZE,
          ) || this.draw(context, objectAtlasCell(cell.type), cell.x, cell.y);
      context.globalAlpha = 1;
    }
    context.strokeStyle = "#99d6ff";
    context.lineWidth = 2;
    context.strokeRect(
      hover.x * EDITOR_TILE_SIZE + 1,
      hover.y * EDITOR_TILE_SIZE + 1,
      EDITOR_TILE_SIZE - 2,
      EDITOR_TILE_SIZE - 2,
    );
  }

  private draw(
    context: CanvasRenderingContext2D,
    cell: { column: number; row: number },
    x: number,
    y: number,
  ): void {
    if (!this.atlas) return;
    context.drawImage(
      this.atlas,
      cell.column * SOURCE_TILE,
      cell.row * SOURCE_TILE,
      SOURCE_TILE,
      SOURCE_TILE,
      x * EDITOR_TILE_SIZE,
      y * EDITOR_TILE_SIZE,
      EDITOR_TILE_SIZE,
      EDITOR_TILE_SIZE,
    );
  }
}
