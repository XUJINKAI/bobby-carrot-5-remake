import type { EntityCatalog, EntityCatalogEntry } from "@bobby/engine/authoring";
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
    maxTimeSeconds?: number;
  };
  selection: EntityCatalogEntry;
  hover: Cell | null;
  cell: EditorCellInspection | null;
  issues: LevelValidationIssue[];
}

export function buildInspectorModel(
  level: EditorLevel,
  catalog: EntityCatalog,
  hover: Cell | null,
  selection: PaletteItem,
): InspectorModel {
  const preview = new EditorPreview(level, catalog);
  const maxMoves = level.rules?.limits?.find((limit) => limit.type === "max-moves");
  const maxTime = level.rules?.limits?.find((limit) => limit.type === "max-time-seconds");
  return {
    document: {
      name: level.name,
      width: level.width,
      height: level.height,
      entityCount: level.entities.length,
      ...(maxMoves?.type === "max-moves" ? { maxMoves: maxMoves.moves } : {}),
      ...(maxTime?.type === "max-time-seconds" ? { maxTimeSeconds: maxTime.seconds } : {}),
    },
    selection: catalog.require(selection.type),
    hover,
    cell: hover ? preview.inspectCell(hover.x, hover.y) : null,
    issues: validateEditorLevel(level, catalog),
  };
}
