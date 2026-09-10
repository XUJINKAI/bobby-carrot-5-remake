import type {
  Direction,
  EntityType,
  JsonPrimitive,
  JsonValue,
} from "@bobby/model";
import { entityRegistry, visualRegistry } from "../entities/registry.js";
import {
  instantiateLevelEntity,
  instantiateSpawnSpec,
  type EntityInstance,
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

/** 省略持久化关卡所需坐标的扁平 canonical Map Entity。 */
export interface LevelEntityVisualPreviewSource {
  type: EntityType;
  stackOrder?: number;
  [key: string]: JsonPrimitive | undefined;
}

/** 直接解析 Runtime spawn spec。 */
export function resolveEntityVisualPreview(
  source: EntityVisualPreviewSource,
): VisualComposition | null {
  return resolveInstantiatedVisualPreview(
    instantiateSpawnSpec(1, {
      ...source,
      x: 0,
      y: 0,
    }),
  );
}

/** 转换并解析扁平 canonical Map Entity，包括该 type 持有的字段。 */
export function resolveLevelEntityVisualPreview(
  source: LevelEntityVisualPreviewSource,
): VisualComposition | null {
  return resolveInstantiatedVisualPreview(
    instantiateLevelEntity(1, {
      ...source,
      x: 0,
      y: 0,
    }),
  );
}

function resolveInstantiatedVisualPreview(
  source: EntityInstance,
): VisualComposition | null {
  const definition = entityRegistry.require(source.type);
  const state = {
    ...defaults(definition.properties),
    ...defaults(definition.state),
    ...(source.state ?? {}),
  };
  const entity: EntityInstance =
    Object.keys(state).length > 0 ? { ...source, state } : source;
  const part = resolveFootprintCells(entity, definition.footprint)[0];
  if (!part) return null;
  const presence: EntityPresence = {
    entityId: entity.id,
    cell: { x: part.x, y: part.y },
    layer: definition.layer ?? "object",
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
    entitiesWithTrait: (trait) =>
      definition.traits.includes(trait) ? [entity] : [],
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
