import {
  resolveFootprintCells,
  type EntityCatalog,
  type EntityCatalogEntry,
} from "@bobby/engine";
import {
  isLevelEntityReservedField,
  type Direction,
  type EntityType,
  type LevelEntity,
} from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import {
  editorCatalogEntry,
  editorEntityDirection,
  isEditorEntityCreatable,
} from "../definitions/entities.js";
import type {
  EditorDefinition,
  EditorPlacementPoint,
  EditorPlacementPreset,
  EditorStackSlot,
} from "../definitions/types.js";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap, EntityRef } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";

export interface Cell {
  x: number;
  y: number;
}

export interface PlacementCell extends Cell {
  role?: string;
}

export type PlacementOverrides = Omit<EditorPlacementPreset, "type">;

export interface EntityPlacementPlan {
  entity: LevelEntity;
  cells: readonly PlacementCell[];
  replace: readonly EntityRef[];
  warnings: readonly EntityPlacementStackWarning[];
  valid: boolean;
}

export interface EntityPlacementStackWarning {
  cell: Cell;
  existing: EntityRef;
  existingType: EntityType;
  placedSlot: EditorStackSlot;
  existingSlot: EditorStackSlot;
}

export function resolvePlacement(
  level: EditorMap,
  catalog: EntityCatalog,
  preset: EditorPlacementPreset,
  cursor: Cell,
  editor: EditorDefinition = builtinEditorDefinition,
  existingPreview?: EditorPreview,
): EntityPlacementPlan {
  const authoring = editor.entities?.[preset.type];
  if (!isEditorEntityCreatable(editor, preset.type, catalog)) {
    return {
      entity: { type: preset.type, x: cursor.x, y: cursor.y },
      cells: [],
      replace: [],
      warnings: [],
      valid: false,
    };
  }

  const presetEntity: LevelEntity = {
    ...(authoring?.defaultFields ?? {}),
    ...(preset.fields ?? {}),
    type: preset.type,
    x: cursor.x,
    y: cursor.y,
  };
  const direction = editorEntityDirection(presetEntity);
  const definition = editorCatalogEntry(catalog, {
    ...presetEntity,
    ...(direction ? { direction } : {}),
  });
  const anchor = resolveAnchor(
    cursor,
    definition,
    authoring?.placementPoint,
    direction,
  );
  const entity = createPlacedEntity(anchor, presetEntity);
  const cells = footprintCells(entity, definition);
  if (
    cells.some(
      (cell) =>
        cell.x < 0 ||
        cell.y < 0 ||
        cell.x >= level.width ||
        cell.y >= level.height,
    )
  ) {
    return { entity, cells, replace: [], warnings: [], valid: false };
  }

  const stackSlot = authoring?.stackSlot;
  if (!stackSlot) {
    return { entity, cells, replace: [], warnings: [], valid: true };
  }
  const preview = existingPreview ?? new EditorPreview(level, catalog);
  const replace = new Map<number, EntityRef>();
  const warnings = new Map<string, EntityPlacementStackWarning>();
  for (const cell of cells) {
    for (const existing of preview.inspectCell(cell.x, cell.y).presences) {
      const existingSlot = editor.entities?.[existing.entity.type]?.stackSlot;
      if (!existingSlot) continue;
      if (existingSlot === stackSlot) {
        replace.set(existing.ref.index, existing.ref);
        continue;
      }
      if (stackSlotsCompatible(stackSlot, existingSlot, editor)) continue;
      const key = `${cell.x},${cell.y}:${existing.ref.index}`;
      warnings.set(key, {
        cell,
        existing: existing.ref,
        existingType: existing.entity.type,
        placedSlot: stackSlot,
        existingSlot,
      });
    }
  }
  return {
    entity,
    cells,
    replace: [...replace.values()],
    warnings: [...warnings.values()],
    valid: true,
  };
}

export function placeEntity(
  catalog: EntityCatalog,
  presetOrType: EditorPlacementPreset | string,
  cursor: Cell,
  overrides: PlacementOverrides = {},
  editor: EditorDefinition = builtinEditorDefinition,
): EditorCommand {
  const preset: EditorPlacementPreset =
    typeof presetOrType === "string"
      ? { type: presetOrType, ...overrides }
      : presetOrType;
  return {
    apply(level) {
      const plan = resolvePlacement(level, catalog, preset, cursor, editor);
      if (!plan.valid) return level;
      const removed = new Set(plan.replace.map((ref) => ref.index));
      return normalizeEditorLevel({
        ...level,
        entities: [
          ...level.entities.filter((_, index) => !removed.has(index)),
          plan.entity,
        ],
      });
    },
  };
}

function stackSlotsCompatible(
  a: EditorStackSlot,
  b: EditorStackSlot,
  editor: EditorDefinition,
): boolean {
  return (editor.stacking?.compatibleSlots ?? []).some(
    ([left, right]) =>
      (left === a && right === b) || (left === b && right === a),
  );
}

export function topEntityRefAt(
  preview: EditorPreview,
  cell: Cell,
): EntityRef | null {
  return preview.inspectCell(cell.x, cell.y).top?.ref ?? null;
}

export function entityCells(
  preview: EditorPreview,
  ref: EntityRef,
): readonly PlacementCell[] {
  return preview.presencesFor(ref).map(({ presence }) => ({
    ...presence.cell,
    ...(presence.role ? { role: presence.role } : {}),
  }));
}

function resolveAnchor(
  cursor: Cell,
  definition: EntityCatalogEntry,
  placementPoint: EditorPlacementPoint | undefined,
  direction: Direction | undefined,
): Cell {
  if (!placementPoint) return cursor;
  if ("offset" in placementPoint) {
    return {
      x: cursor.x + placementPoint.offset.dx,
      y: cursor.y + placementPoint.offset.dy,
    };
  }
  const cells = resolveFootprintCells(
    { anchor: { x: 0, y: 0 }, ...(direction ? { direction } : {}) },
    definition.footprint,
  );
  const target = cells.find((cell) => cell.role === placementPoint.role);
  return target
    ? { x: cursor.x - target.x, y: cursor.y - target.y }
    : cursor;
}

function footprintCells(
  entity: LevelEntity,
  definition: EntityCatalogEntry,
): PlacementCell[] {
  const direction = editorEntityDirection(entity);
  return resolveFootprintCells(
    {
      anchor: { x: entity.x, y: entity.y },
      ...(direction ? { direction } : {}),
    },
    definition.footprint,
  ).map((cell) => ({
    x: cell.x,
    y: cell.y,
    ...(cell.role ? { role: cell.role } : {}),
  }));
}

function createPlacedEntity(
  anchor: Cell,
  source: Readonly<LevelEntity>,
): LevelEntity {
  const entity: LevelEntity = {
    type: source.type,
    x: anchor.x,
    y: anchor.y,
  };
  for (const [key, value] of Object.entries(source)) {
    if (!key || isLevelEntityReservedField(key)) continue;
    entity[key] = value;
  }
  return entity;
}
