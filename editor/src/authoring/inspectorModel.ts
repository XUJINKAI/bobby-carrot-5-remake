import {
  inspectObjectDefinition,
  inspectTerrainDefinition,
  type TileDefinitionInspection,
} from "@bobby/engine";
import { validateEditorLevel } from "../level/validation.js";
import type { EditorLevel, LevelValidationIssue } from "../level/types.js";
import type { PaletteItem } from "./paletteCatalog.js";
import {
  resolveObjectOwner,
  type Cell,
  type ResolvedObject,
} from "./objectOwners.js";

export interface InspectorModel {
  document: {
    name: string;
    width: number;
    height: number;
    objectCount: number;
    maxMoves?: number;
  };
  selection: TileDefinitionInspection;
  hover: Cell | null;
  owner: ResolvedObject | null;
  ownerDefinition: TileDefinitionInspection | null;
  issues: LevelValidationIssue[];
}

export function buildInspectorModel(
  level: EditorLevel,
  hover: Cell | null,
  selection: PaletteItem,
): InspectorModel {
  const owner = hover ? resolveObjectOwner(level, hover.x, hover.y) : null;
  return {
    document: {
      name: level.name,
      width: level.width,
      height: level.height,
      objectCount: level.objects.length,
      ...(level.rules?.maxMoves ? { maxMoves: level.rules.maxMoves } : {}),
    },
    selection:
      selection.kind === "terrain"
        ? inspectTerrainDefinition(selection.type)
        : inspectObjectDefinition(selection.type),
    hover,
    owner,
    ownerDefinition: owner ? inspectObjectDefinition(owner.object.type) : null,
    issues: validateEditorLevel(level),
  };
}
