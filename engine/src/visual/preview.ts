import type { Direction, EntityType, JsonValue } from "@bobby/model";
import { entityRegistry, visualRegistry } from "../entities/registry.js";
import {
  instantiateSpawnSpec,
  type EntityState,
} from "../world/entity/EntityInstance.js";
import type { EntityPresence } from "../world/spatial/EntityPresence.js";
import { resolveFootprintCells } from "../world/spatial/Footprint.js";
import type {
  VisualComposition,
  VisualQuery,
} from "./VisualDefinition.js";

export interface EntityVisualPreviewSource {
  type: EntityType;
  direction?: Direction;
  state?: EntityState;
  instanceTraits?: readonly string[];
}

export function resolveEntityVisualPreview(
  source: EntityVisualPreviewSource,
): VisualComposition | null {
  const definition = entityRegistry.require(source.type);
  const state = {
    ...defaults(definition.properties),
    ...defaults(definition.state),
    ...(source.state ?? {}),
  };
  const entity = instantiateSpawnSpec(1, {
    type: source.type,
    x: 0,
    y: 0,
    ...(source.direction ? { direction: source.direction } : {}),
    ...(Object.keys(state).length > 0 ? { state } : {}),
    ...(source.instanceTraits?.length
      ? { instanceTraits: source.instanceTraits }
      : {}),
  });
  const part = resolveFootprintCells(entity, definition.footprint)[0];
  if (!part) return null;
  const presence: EntityPresence = {
    entityId: entity.id,
    cell: { x: part.x, y: part.y },
    layer: definition.layer ?? "object",
    ...(part.role ? { role: part.role } : {}),
    traits: [...new Set([
      ...definition.traits,
      ...(entity.instanceTraits ?? []),
      ...(part.traits ?? []),
    ])],
    stackOrder: part.stackOrder ?? definition.stackOrder ?? 0,
  };
  const query: VisualQuery = {
    inBounds: () => true,
    presencesAt: () => [],
    entity: (id) => (id === entity.id ? entity : undefined),
  };
  return visualRegistry.resolve(definition, { entity, presence, query });
}

function defaults(
  fields: readonly { key: string; default?: JsonValue }[] | undefined,
): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {};
  for (const field of fields ?? [])
    if (field.default !== undefined)
      result[field.key] = structuredClone(field.default);
  return result;
}
