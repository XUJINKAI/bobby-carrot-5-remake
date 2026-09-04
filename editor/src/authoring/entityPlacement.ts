import {
  resolveFootprintCells,
  type EntityCatalog,
  type EntityCatalogEntry,
} from "@bobby/engine";
import type { JsonValue, LevelEntity } from "@bobby/model";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import { isEditorEntityCreatable } from "../definitions/entities.js";
import type {
  EditorDefinition,
  EditorPlacementPoint,
  EditorPlacementPreset,
} from "../definitions/types.js";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap, EntityRef } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";
import { isSurfaceEntityType } from "./surfaceAuthoring.js";

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
  valid: boolean;
}

export function resolvePlacement(
  level: EditorMap,
  catalog: EntityCatalog,
  preset: EditorPlacementPreset,
  cursor: Cell,
  editor: EditorDefinition = builtinEditorDefinition,
): EntityPlacementPlan {
  const definition = catalog.require(preset.type);
  const authoring = editor.entities?.[preset.type];
  if (!isEditorEntityCreatable(editor, preset.type)) {
    return {
      entity: { type: preset.type, x: cursor.x, y: cursor.y },
      cells: [],
      replace: [],
      valid: false,
    };
  }

  const direction = preset.direction ?? authoring?.defaultDirection;
  const anchor = resolveAnchor(
    cursor,
    definition,
    authoring?.placementPoint,
    direction,
  );
  const entity = createPlacedEntity(definition, anchor, preset, direction);
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
    return { entity, cells, replace: [], valid: false };
  }

  const replaceGroup = authoring?.replaceGroup;
  if (!replaceGroup) return { entity, cells, replace: [], valid: true };
  // Surface 的区域编辑由 Surface authoring 自己管理。保留直接放置真正 Surface
  // 时的旧 API 替换语义，但不要让历史上误标为 surface 的机关删除地貌。
  if (replaceGroup === "surface" && !isSurfaceEntityType(preset.type)) {
    return { entity, cells, replace: [], valid: true };
  }
  const preview = new EditorPreview(level, catalog);
  const replace = new Map<number, EntityRef>();
  for (const cell of cells) {
    for (const existing of preview.inspectCell(cell.x, cell.y).presences) {
      if (editor.entities?.[existing.entity.type]?.replaceGroup !== replaceGroup)
        continue;
      replace.set(existing.ref.index, existing.ref);
    }
  }
  return { entity, cells, replace: [...replace.values()], valid: true };
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
  direction: LevelEntity["direction"],
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
  return resolveFootprintCells(
    {
      anchor: { x: entity.x, y: entity.y },
      ...(entity.direction ? { direction: entity.direction } : {}),
    },
    definition.footprint,
  ).map((cell) => ({
    x: cell.x,
    y: cell.y,
    ...(cell.role ? { role: cell.role } : {}),
  }));
}

function createPlacedEntity(
  definition: EntityCatalogEntry,
  anchor: Cell,
  preset: EditorPlacementPreset,
  direction: LevelEntity["direction"],
): LevelEntity {
  const properties = defaults(definition.properties);
  const state = defaults(definition.state);
  const entity: LevelEntity = {
    type: definition.type,
    x: anchor.x,
    y: anchor.y,
  };
  if (direction) entity.direction = direction;
  const mergedProperties = { ...properties, ...preset.properties };
  if (Object.keys(mergedProperties).length > 0)
    entity.properties = mergedProperties;
  const mergedState = { ...state, ...preset.state };
  if (Object.keys(mergedState).length > 0) entity.state = mergedState;
  return entity;
}

function defaults(
  fields: EntityCatalogEntry["properties"] | EntityCatalogEntry["state"],
): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {};
  for (const field of fields ?? []) {
    if (field.default !== undefined)
      result[field.key] = structuredClone(field.default);
  }
  return result;
}
