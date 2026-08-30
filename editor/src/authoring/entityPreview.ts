import {
  resolveFootprintCells,
  type EntityCatalog,
} from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type {
  EditorDefinition,
  EditorPlacementPreset,
} from "../definitions/types.js";

export interface EditorEntityPreviewLayout {
  width: number;
  height: number;
  entity: LevelEntity;
}

export function resolveEditorEntityPreviewLayout(
  catalog: EntityCatalog,
  source: EditorPlacementPreset,
  editor: EditorDefinition = builtinEditorDefinition,
): EditorEntityPreviewLayout {
  const definition = catalog.require(source.type);
  const direction =
    source.direction ?? editor.entities?.[source.type]?.defaultDirection;
  const prototype: LevelEntity = {
    type: source.type,
    x: 0,
    y: 0,
    ...(direction ? { direction } : {}),
    ...(source.properties
      ? { properties: structuredClone(source.properties) }
      : {}),
    ...(source.state ? { state: structuredClone(source.state) } : {}),
  };
  const cells = resolveFootprintCells(
    {
      anchor: { x: 0, y: 0 },
      ...(prototype.direction ? { direction: prototype.direction } : {}),
    },
    definition.footprint,
  );
  let minX = Math.min(...cells.map((cell) => cell.x));
  let minY = Math.min(...cells.map((cell) => cell.y));
  let maxX = Math.max(...cells.map((cell) => cell.x));
  let maxY = Math.max(...cells.map((cell) => cell.y));
  const visualBounds = definition.presentation.visualBounds;
  if (visualBounds) {
    minX = Math.min(minX, Math.trunc(visualBounds.left));
    minY = Math.min(minY, Math.trunc(visualBounds.top));
    maxX = Math.max(maxX, Math.trunc(visualBounds.right));
    maxY = Math.max(maxY, Math.trunc(visualBounds.bottom));
  }
  prototype.x = -minX;
  prototype.y = -minY;
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    entity: prototype,
  };
}
