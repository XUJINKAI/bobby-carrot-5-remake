import type {
  EntityProperties,
  EntityState,
  EntityTraits,
  EntityType,
  JsonValue,
  LevelEntity,
} from "@bobby/model";
import {
  entityCatalog,
  entityRegistry,
  visualRegistry,
} from "../entities/registry.js";
import type { EntityFieldDefinition } from "../world/entity/EntityDefinition.js";
import { instantiateLevelEntity } from "../world/entity/EntityInstance.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import { resolveFootprintCells } from "../world/spatial/Footprint.js";
import type {
  VisualComposition,
  VisualQuery,
  VisualResolveContext,
} from "./VisualDefinition.js";

export interface EntityVisualPreviewSource {
  type: EntityType;
  direction?: LevelEntity["direction"];
  properties?: EntityProperties;
  state?: EntityState;
  traits?: EntityTraits;
}

/**
 * Resolve one isolated authoring/icon preview. Entity authoring.editorVisual may override the
 * runtime visual; otherwise the normal VisualDefinition remains the single fallback.
 */
export function resolveEntityVisualPreview(
  source: EntityVisualPreviewSource,
): VisualComposition | null {
  const definition = entityRegistry.require(source.type);
  const catalogEntry = entityCatalog.require(source.type);
  const properties = {
    ...defaults(definition.properties),
    ...(source.properties ?? {}),
  };
  const state = {
    ...defaults(definition.state),
    ...(source.state ?? {}),
  };
  const levelEntity: LevelEntity = {
    type: source.type,
    x: 0,
    y: 0,
  };
  const direction = source.direction ?? catalogEntry.authoring?.defaultDirection;
  if (direction) levelEntity.direction = direction;
  if (Object.keys(properties).length > 0) levelEntity.properties = properties;
  if (Object.keys(state).length > 0) levelEntity.state = state;
  if (source.traits?.length) levelEntity.traits = [...new Set(source.traits)];

  const entity = instantiateLevelEntity(1, levelEntity);
  const part = resolveFootprintCells(entity, definition.footprint)[0];
  if (!part) return null;
  const presence: EntityPresence = {
    entityId: entity.id,
    cell: { x: part.x, y: part.y },
    ...(part.role ? { role: part.role } : {}),
    traits: [
      ...new Set([
        ...definition.traits,
        ...(entity.instanceTraits ?? []),
        ...(part.traits ?? []),
      ]),
    ],
    stackOrder: part.stackOrder ?? definition.stackOrder ?? 0,
  };
  const query: VisualQuery = {
    inBounds: () => true,
    presencesAt: () => [],
    entity: (id) => (id === entity.id ? entity : undefined),
  };
  const context: VisualResolveContext = { entity, presence, query };
  return (
    catalogEntry.authoring?.editorVisual?.(context) ??
    visualRegistry.resolve(definition, context)
  );
}

function defaults(
  fields: readonly EntityFieldDefinition[] | undefined,
): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {};
  for (const field of fields ?? []) {
    if (field.default !== undefined) {
      result[field.key] = structuredClone(field.default);
    }
  }
  return result;
}
