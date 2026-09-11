import {
  entityMapDefinition,
  surfaceMappingForEntity,
  type Direction,
  type EntityType,
  type JsonValue,
  type LevelEntity,
  type LevelEntityFieldValue,
} from "@bobby/model";
import { originalSurfaceTraits } from "../../entities/original/surface-traits.js";

export type EntityId = number;
export type EntityState = Record<string, JsonValue>;

export interface CellPosition {
  x: number;
  y: number;
}

/** Engine 持有的运行时生成合同；这里可以使用只存在于 Runtime 的 Entity type。 */
export interface EntitySpawnSpec {
  type: EntityType;
  x: number;
  y: number;
  direction?: Direction;
  stackOrder?: number;
  state?: EntityState;
  instanceTraits?: readonly string[];
}

/** World 中一个具体 Entity 的运行时身份与可变状态。 */
export interface EntityInstance {
  id: EntityId;
  type: EntityType;
  anchor: CellPosition;
  direction?: Direction;
  stackOrder?: number;
  state?: EntityState;
  instanceTraits?: string[];
}

/** 把标准的扁平 Map JSON 转换为 Engine Runtime 结构。 */
export function instantiateLevelEntity(
  id: EntityId,
  source: LevelEntity,
): EntityInstance {
  const definition = entityMapDefinition(source.type);
  const state: EntityState = {};
  const sourceDirection = source["direction"];
  let direction: Direction | undefined =
    definition === undefined && isDirection(sourceDirection)
      ? sourceDirection
      : undefined;

  for (const field of definition?.fields ?? []) {
    const raw = source[field.key];
    const value = raw === undefined ? field.default : raw;
    if (value === undefined) continue;
    if (field.key === "direction" && isDirection(value)) {
      direction = value;
      continue;
    }
    state[field.key] = structuredClone(value) as JsonValue;
  }

  const surfaceMapping = surfaceMappingForEntity(source.type, source);
  const instanceTraits = surfaceMapping
    ? originalSurfaceTraits(surfaceMapping)
    : [];

  return {
    id,
    type: source.type,
    anchor: { x: source.x, y: source.y },
    ...(direction ? { direction } : {}),
    ...(Number.isFinite(source.stackOrder)
      ? { stackOrder: source.stackOrder }
      : {}),
    ...(Object.keys(state).length > 0 ? { state } : {}),
    ...(instanceTraits.length > 0
      ? { instanceTraits: [...instanceTraits] }
      : {}),
  };
}

export function instantiateSpawnSpec(
  id: EntityId,
  source: EntitySpawnSpec,
): EntityInstance {
  return {
    id,
    type: source.type,
    anchor: { x: source.x, y: source.y },
    ...(source.direction ? { direction: source.direction } : {}),
    ...(Number.isFinite(source.stackOrder)
      ? { stackOrder: source.stackOrder }
      : {}),
    ...(source.state ? { state: structuredClone(source.state) } : {}),
    ...(source.instanceTraits?.length
      ? { instanceTraits: [...new Set(source.instanceTraits)] }
      : {}),
  };
}

function isDirection(
  value: LevelEntityFieldValue | undefined,
): value is Direction {
  return (
    value === "up" ||
    value === "down" ||
    value === "left" ||
    value === "right"
  );
}
