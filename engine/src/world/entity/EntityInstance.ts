import type {
  Direction,
  EntityProperties,
  EntityState,
  EntityTraits,
  EntityType,
  LevelEntity,
} from "@bobby/model";

export type EntityId = number;

export interface CellPosition {
  x: number;
  y: number;
}

/** World 中一个具体 Entity 的运行时身份与可变状态。 */
export interface EntityInstance {
  id: EntityId;
  type: EntityType;
  anchor: CellPosition;
  direction?: Direction;
  properties?: EntityProperties;
  state?: EntityState;
  instanceTraits?: EntityTraits;
}

export function instantiateLevelEntity(
  id: EntityId,
  source: LevelEntity,
): EntityInstance {
  return {
    id,
    type: source.type,
    anchor: { x: source.x, y: source.y },
    ...(source.direction ? { direction: source.direction } : {}),
    ...(source.properties
      ? { properties: structuredClone(source.properties) }
      : {}),
    ...(source.state ? { state: structuredClone(source.state) } : {}),
    ...(source.traits ? { instanceTraits: [...source.traits] } : {}),
  };
}
