import {
  resolveFootprintCells,
  type EntityCatalog,
} from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import {
  editorCatalogEntry,
  editorEntityDirection,
} from "../definitions/entities.js";
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
  const entityPolicy = editor.entities?.[source.type];
  const prototype: LevelEntity = {
    ...(entityPolicy?.defaultFields
      ? structuredClone(entityPolicy.defaultFields)
      : {}),
    ...(source.fields ? structuredClone(source.fields) : {}),
    type: source.type,
    x: 0,
    y: 0,
  };
  const definition = editorCatalogEntry(catalog, prototype);
  const prototypeDirection = editorEntityDirection(prototype);
  const cells = resolveFootprintCells(
    {
      anchor: { x: 0, y: 0 },
      ...(prototypeDirection ? { direction: prototypeDirection } : {}),
    },
    definition.footprint,
  );
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  prototype.x = -minX;
  prototype.y = -minY;
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    entity: prototype,
  };
}
