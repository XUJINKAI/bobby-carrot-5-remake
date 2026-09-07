import {
  EntityTypeId,
  MapEntityTypeId,
  entityMapDefinition,
  type Direction,
  type EntityType,
  type JsonPrimitive,
  type JsonValue,
  type LevelEntity,
} from "@bobby/model";

export type EntityId = number;
export type EntityState = Record<string, JsonValue>;

export interface CellPosition {
  x: number;
  y: number;
}

/** Engine-owned runtime spawn contract. Runtime-only entity types are valid here. */
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

/** Convert canonical flat Map JSON into the Engine runtime shape. */
export function instantiateLevelEntity(
  id: EntityId,
  source: LevelEntity,
): EntityInstance {
  const definition = entityMapDefinition(source.type);
  const state: EntityState = {};
  let direction: Direction | undefined;

  for (const field of definition?.fields ?? []) {
    const raw = source[field.key];
    const value = raw === undefined ? field.default : raw;
    if (value === undefined) continue;
    if (field.key === "direction" && isDirection(value)) {
      direction = value;
      continue;
    }
    state[field.key] = structuredClone(value);
  }

  return {
    id,
    type: runtimeTypeForLevelEntity(source),
    anchor: { x: source.x, y: source.y },
    ...(direction ? { direction } : {}),
    ...(Number.isFinite(source.stackOrder)
      ? { stackOrder: source.stackOrder }
      : {}),
    ...(Object.keys(state).length > 0 ? { state } : {}),
  };
}

function runtimeTypeForLevelEntity(source: LevelEntity): EntityType {
  if (source.type === MapEntityTypeId.COLOR_SWITCH)
    return source.color === "pink"
      ? EntityTypeId.COLOR_PINK_SWITCH
      : EntityTypeId.COLOR_YELLOW_SWITCH;
  if (source.type === MapEntityTypeId.COLOR_BLOCK)
    return source.color === "pink"
      ? EntityTypeId.COLOR_PINK_BLOCK
      : EntityTypeId.COLOR_YELLOW_BLOCK;
  if (source.type === MapEntityTypeId.WINDMILL) {
    return {
      up: EntityTypeId.WINDMILL_UP,
      down: EntityTypeId.WINDMILL_DOWN,
      left: EntityTypeId.WINDMILL_LEFT,
      right: EntityTypeId.WINDMILL_RIGHT,
    }[String(source.direction)] ?? EntityTypeId.WINDMILL_UP;
  }
  if (source.type === MapEntityTypeId.CLOUD) {
    return {
      red: EntityTypeId.CLOUD_RED,
      purple: EntityTypeId.CLOUD_PURPLE,
      green: EntityTypeId.CLOUD_GREEN,
    }[String(source.color)] ?? EntityTypeId.CLOUD_RED;
  }
  if (source.type === MapEntityTypeId.CLOUD_PARKING) {
    return {
      red: EntityTypeId.CLOUD_GRID_RED,
      purple: EntityTypeId.CLOUD_GRID_PURPLE,
      green: EntityTypeId.CLOUD_GRID_GREEN,
    }[String(source.color)] ?? EntityTypeId.CLOUD_GRID_RED;
  }
  return source.type;
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

function isDirection(value: JsonPrimitive | undefined): value is Direction {
  return (
    value === "up" ||
    value === "down" ||
    value === "left" ||
    value === "right"
  );
}
