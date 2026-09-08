import {
  resolveFootprintCells,
  type EntityCatalog,
  type EntityCatalogEntry,
} from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import {
  editorCatalogEntry,
  editorEntityDirection,
} from "../definitions/entities.js";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap } from "../level/types.js";

export interface EditorResizeEdges {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface EditorResizeResult {
  map: EditorMap;
  edges: EditorResizeEdges;
  removedCount: number;
}

export function previewEditorResize(
  map: EditorMap,
  catalog: EntityCatalog,
  request: EditorResizeEdges,
): EditorResizeResult {
  const horizontal = effectiveAxis(map.width, request.left, request.right);
  const vertical = effectiveAxis(map.height, request.top, request.bottom);
  const edges: EditorResizeEdges = {
    left: horizontal.before,
    right: horizontal.after,
    top: vertical.before,
    bottom: vertical.after,
  };
  const shifted = map.entities.map((entity) => ({
    ...structuredClone(entity),
    x: entity.x + edges.left,
    y: entity.y + edges.top,
  }));
  const entities = shifted.filter((entity) =>
    entityFits(entity, horizontal.size, vertical.size, catalog),
  );
  return {
    map: normalizeEditorLevel({
      ...map,
      width: horizontal.size,
      height: vertical.size,
      entities,
    }),
    edges,
    removedCount: shifted.length - entities.length,
  };
}

export function resizeMapEdges(
  catalog: EntityCatalog,
  edges: EditorResizeEdges,
): EditorCommand {
  return {
    apply(map) {
      return previewEditorResize(map, catalog, edges).map;
    },
  };
}

function entityFits(
  entity: LevelEntity,
  width: number,
  height: number,
  catalog: EntityCatalog,
): boolean {
  let definition: EntityCatalogEntry;
  try {
    definition = editorCatalogEntry(catalog, entity);
  } catch {
    return inside(entity.x, entity.y, width, height);
  }
  const direction = editorEntityDirection(entity);
  const cells = resolveFootprintCells(
    {
      anchor: { x: entity.x, y: entity.y },
      ...(direction ? { direction } : {}),
    },
    definition.footprint,
  );
  return cells.every((cell) => inside(cell.x, cell.y, width, height));
}

function inside(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

function effectiveAxis(
  size: number,
  beforeRequest: number,
  afterRequest: number,
): { before: number; after: number; size: number } {
  const before = Math.trunc(beforeRequest || 0);
  const after = Math.trunc(afterRequest || 0);
  const nextSize = clampDimension(size + before + after);
  const delta = nextSize - size;
  if (before !== 0 && after === 0)
    return { before: delta, after: 0, size: nextSize };
  if (after !== 0 && before === 0)
    return { before: 0, after: delta, size: nextSize };
  return { before, after: delta - before, size: nextSize };
}

function clampDimension(value: number): number {
  return Math.min(128, Math.max(3, Math.trunc(value)));
}
