import {
  resolveFootprintCells,
  visualRegistry as builtinVisualRegistry,
  type EntityCatalog,
  type EntityCatalogEntry,
  type VisualRegistry,
} from "@bobby/engine/authoring";
import type {
  EntityProperties,
  EntityState,
  EntityTraits,
  EntityType,
  JsonValue,
  LevelEntity,
} from "@bobby/model";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorLevel, EntityRef } from "../level/types.js";
import { EditorPreview } from "./EditorPreview.js";

export interface Cell {
  x: number;
  y: number;
}

export interface PlacementCell extends Cell {
  role?: string;
}

export interface PlacementOverrides {
  direction?: LevelEntity["direction"];
  properties?: EntityProperties;
  state?: EntityState;
  traits?: EntityTraits;
}

export interface PlacementResolveOptions {
  placementSequence?: number;
  visuals?: VisualRegistry;
}

export interface EntityPlacementPlan {
  entity: LevelEntity;
  cells: readonly PlacementCell[];
  replace: readonly EntityRef[];
  valid: boolean;
}

export function resolvePlacement(
  level: EditorLevel,
  catalog: EntityCatalog,
  type: EntityType,
  cursor: Cell,
  overrides: PlacementOverrides = {},
  options: PlacementResolveOptions = {},
): EntityPlacementPlan {
  const definition = catalog.require(type);
  const cursorOffset = definition.authoring?.cursor ?? { dx: 0, dy: 0 };
  const anchor = {
    x: cursor.x - cursorOffset.dx,
    y: cursor.y - cursorOffset.dy,
  };
  const visuals = options.visuals ?? builtinVisualRegistry;
  const entity = visuals.initializeAuthoringEntity(
    createPlacedEntity(definition, anchor, overrides),
    definition,
    options.placementSequence ?? 0,
  );
  const cells = resolveFootprintCells(
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
  if (
    cells.some(
      (cell) =>
        cell.x < 0 ||
        cell.y < 0 ||
        cell.x >= level.width ||
        cell.y >= level.height,
    )
  )
    return { entity, cells, replace: [], valid: false };

  const replaceGroup = definition.authoring?.replaceGroup;
  if (!replaceGroup) return { entity, cells, replace: [], valid: true };

  const preview = new EditorPreview(level, catalog);
  const replace = new Map<number, EntityRef>();
  for (const cell of cells) {
    for (const existing of preview.inspectCell(cell.x, cell.y).presences) {
      if (existing.definition.authoring?.replaceGroup !== replaceGroup) continue;
      replace.set(existing.ref.index, existing.ref);
    }
  }
  return { entity, cells, replace: [...replace.values()], valid: true };
}

export function placeEntity(
  catalog: EntityCatalog,
  type: EntityType,
  cursor: Cell,
  overrides: PlacementOverrides = {},
  options: PlacementResolveOptions = {},
): EditorCommand {
  return {
    apply(level) {
      const plan = resolvePlacement(
        level,
        catalog,
        type,
        cursor,
        overrides,
        options,
      );
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

function createPlacedEntity(
  definition: EntityCatalogEntry,
  anchor: Cell,
  overrides: PlacementOverrides,
): LevelEntity {
  const properties = defaults(definition.properties);
  const state = defaults(definition.state);
  const entity: LevelEntity = {
    type: definition.type,
    x: anchor.x,
    y: anchor.y,
  };
  const direction = overrides.direction ?? definition.authoring?.defaultDirection;
  if (direction) entity.direction = direction;
  const mergedProperties = { ...properties, ...overrides.properties };
  if (Object.keys(mergedProperties).length > 0)
    entity.properties = mergedProperties;
  const mergedState = { ...state, ...overrides.state };
  if (Object.keys(mergedState).length > 0) entity.state = mergedState;
  if (overrides.traits?.length)
    entity.traits = [...new Set(overrides.traits)];
  return entity;
}

function defaults(
  fields: EntityCatalogEntry["properties"] | EntityCatalogEntry["state"],
): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {};
  for (const field of fields ?? [])
    if (field.default !== undefined)
      result[field.key] = structuredClone(field.default);
  return result;
}
