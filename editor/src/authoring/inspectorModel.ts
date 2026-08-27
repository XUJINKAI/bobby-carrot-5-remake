import type { EntityDefinition, EntityRegistry } from "@bobby/engine";
import { validateEditorLevel } from "../level/validation.js";
import type { EditorLevel, LevelValidationIssue } from "../level/types.js";
import { EditorPreview, type EditorCellInspection } from "./EditorPreview.js";
import type { Cell } from "./entityPlacement.js";
import type { PaletteItem } from "./paletteCatalog.js";

export interface InspectorModel {
  document: {
    name: string;
    width: number;
    height: number;
    entityCount: number;
    maxMoves?: number;
  };
  selection: EntityDefinition;
  hover: Cell | null;
  cell: EditorCellInspection | null;
  issues: LevelValidationIssue[];
}

export function buildInspectorModel(
  level: EditorLevel,
  registry: EntityRegistry,
  hover: Cell | null,
  selection: PaletteItem,
): InspectorModel {
  const preview = new EditorPreview(level, registry);
  return {
    document: {
      name: level.name,
      width: level.width,
      height: level.height,
      entityCount: level.entities.length,
      ...(level.rules?.maxMoves ? { maxMoves: level.rules.maxMoves } : {}),
    },
    selection: registry.require(selection.type),
    hover,
    cell: hover ? preview.inspectCell(hover.x, hover.y) : null,
    issues: validateEditorLevel(level, registry),
  };
}
