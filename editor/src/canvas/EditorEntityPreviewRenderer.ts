import {
  buildSpatialScene,
  builtinEngineEnvironment,
  createIndexedSpatialSceneSource,
  drawVisualComposition,
  prepareCanvas,
  resolveDevicePixelRatio,
  SpatialVisualQuery,
  type EngineEnvironment,
  type ImageManager,
  type VisualQuery,
} from "@bobby/engine";
import type { JsonPrimitive } from "@bobby/model";
import { resolveEditorEntityPreviewLayout } from "../authoring/entityPreview.js";
import { EditorPreview } from "../authoring/EditorPreview.js";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type {
  EditorDefinition,
  EditorPlacementPreset,
} from "../definitions/types.js";
import type { EditorMap } from "../level/types.js";

interface PixelBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export class EditorEntityPreviewRenderer {
  constructor(
    private readonly images: ImageManager,
    private readonly environment: EngineEnvironment = builtinEngineEnvironment,
    private readonly editor: EditorDefinition = builtinEditorDefinition,
  ) {}

  render(
    canvas: HTMLCanvasElement,
    source: EditorPlacementPreset,
    cellSize: number,
    previewState?: Readonly<Record<string, JsonPrimitive>>,
  ): boolean {
    const layout = resolveEditorEntityPreviewLayout(
      this.environment.catalog,
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
      meta: { name: "Entity Preview" },
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
    const preview = new EditorPreview(level, this.environment);
    const spatialQuery = new SpatialVisualQuery(preview.entities, preview.spatial);
    const previewEntity = preview.entities.require(1);
    const visualEntity = previewState
      ? {
          ...previewEntity,
          state: {
            ...(previewEntity.state ?? {}),
            ...previewState,
          },
        }
      : previewEntity;
    const query: VisualQuery = previewState
      ? {
          inBounds: (cell) => spatialQuery.inBounds(cell),
          presencesAt: (cell) => spatialQuery.presencesAt(cell),
          entity: (id) => id === visualEntity.id
            ? visualEntity
            : spatialQuery.entity(id),
          entitiesWithFact: (fact) => spatialQuery.entitiesWithFact(fact)
            .map((entity) => entity.id === visualEntity.id ? visualEntity : entity),
        }
      : spatialQuery;
    const source = createIndexedSpatialSceneSource(
      preview.entities,
      preview.spatial,
      this.environment.catalog.entities,
      { query, entity: (id) => query.entity(id) },
    );
    const scene = buildSpatialScene({
      source,
      visuals: this.environment.visuals,
      resolveVisual: (definition, resolveContext) =>
        this.editor.entities?.[resolveContext.entity.type]?.editorVisual?.(
          resolveContext,
        ) ?? this.environment.visuals.resolve(definition, resolveContext),
    });
    const items = [...scene.world, ...scene.standing, ...scene.effect];
    const rendered = items.some((item) => item.composition.layers.length > 0);
    for (const item of items) {
      drawVisualComposition(
        context,
        this.images,
        item.composition,
        item.visualX * naturalTile,
        item.visualY * naturalTile,
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
  const deviceScale = resolveDevicePixelRatio();
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const context = canvas.getContext("2d");
  if (!context) return;
  prepareCanvas(canvas, context, cssWidth, cssHeight, deviceScale);
  context.clearRect(0, 0, cssWidth, cssHeight);
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
