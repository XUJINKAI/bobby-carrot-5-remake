import {
  createBuiltinEntityCatalog,
  SpatialVisualQuery,
  visualRegistry as builtinVisualRegistry,
  type EntityCatalog,
  type ImageManager,
  type VisualRegistry,
} from "@bobby/engine";
import { resolveEditorEntityPreviewLayout } from "../authoring/entityPreview.js";
import { EditorPreview } from "../authoring/EditorPreview.js";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type {
  EditorDefinition,
  EditorPlacementPreset,
} from "../definitions/types.js";
import type { EditorMap } from "../level/types.js";
import { drawEditorVisualComposition } from "./visualPainter.js";

interface PixelBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export class EditorEntityPreviewRenderer {
  constructor(
    private readonly images: ImageManager,
    private readonly catalog: EntityCatalog = createBuiltinEntityCatalog(),
    private readonly editor: EditorDefinition = builtinEditorDefinition,
    private readonly visuals: VisualRegistry = builtinVisualRegistry,
  ) {}

  render(
    canvas: HTMLCanvasElement,
    source: EditorPlacementPreset,
    cellSize: number,
  ): boolean {
    const layout = resolveEditorEntityPreviewLayout(
      this.catalog,
      source,
      this.editor,
    );
    const naturalTile = this.images.sourceTileSize;
    const margin = naturalTile;
    const offscreen = document.createElement("canvas");
    offscreen.width = layout.width * naturalTile + margin * 2;
    offscreen.height = layout.height * naturalTile + margin * 2;
    const context = offscreen.getContext("2d");
    if (!context) return false;
    context.imageSmoothingEnabled = false;

    const level: EditorMap = {
      schemaVersion: 1,
      name: "Entity Preview",
      width: layout.width + 2,
      height: layout.height + 2,
      entities: [
        {
          ...layout.entity,
          x: layout.entity.x + 1,
          y: layout.entity.y + 1,
        },
      ],
    };
    const preview = new EditorPreview(level, this.catalog);
    const query = new SpatialVisualQuery(preview.entities, preview.spatial);
    const inspections = [...preview.presencesFor({ index: 0 })].sort(
      (a, b) => a.presence.stackOrder - b.presence.stackOrder,
    );
    let rendered = false;
    for (const inspection of inspections) {
      const entity = preview.entities.require(inspection.presence.entityId);
      const resolveContext = { entity, presence: inspection.presence, query };
      const composition =
        this.editor.entities?.[entity.type]?.editorVisual?.(resolveContext) ??
        this.visuals.resolve(inspection.definition, resolveContext);
      rendered ||= Boolean(composition?.layers.length);
      drawEditorVisualComposition(
        context,
        this.images,
        composition,
        inspection.presence.cell.x * naturalTile,
        inspection.presence.cell.y * naturalTile,
        naturalTile,
      );
    }

    const fallback: PixelBounds = {
      left: margin,
      top: margin,
      width: layout.width * naturalTile,
      height: layout.height * naturalTile,
    };
    const bounds = opaqueBounds(context, offscreen, fallback);
    drawFitted(canvas, offscreen, bounds, layout.width, layout.height, cellSize);
    return rendered;
  }
}

function opaqueBounds(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  fallback: PixelBounds,
): PixelBounds {
  try {
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    let left = canvas.width;
    let top = canvas.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (image.data[(y * canvas.width + x) * 4 + 3] === 0) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < left || bottom < top) return fallback;
    return {
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1,
    };
  } catch {
    return fallback;
  }
}

function drawFitted(
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement,
  bounds: PixelBounds,
  widthCells: number,
  heightCells: number,
  cellSize: number,
): void {
  const cssWidth = Math.max(1, widthCells * cellSize);
  const cssHeight = Math.max(1, heightCells * cellSize);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);
  context.imageSmoothingEnabled = false;
  const padding = Math.max(2, Math.min(cellSize * 0.08, 5));
  const scale = Math.min(
    (cssWidth - padding * 2) / bounds.width,
    (cssHeight - padding * 2) / bounds.height,
  );
  const drawWidth = bounds.width * scale;
  const drawHeight = bounds.height * scale;
  context.drawImage(
    source,
    bounds.left,
    bounds.top,
    bounds.width,
    bounds.height,
    (cssWidth - drawWidth) / 2,
    (cssHeight - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}
