import { MapEntityTypeId, type Direction } from "@bobby/model";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityInstance } from "../../world/entity/EntityInstance.js";
import {
  LEAF_MOVEMENT,
  type ActionMovementCadence,
} from "../movement/MovementCadence.js";
import {
  addDirection,
  movingSupportOccupiedAt,
  oppositeDirection,
} from "./moving-platform-collision.js";

export interface LeafRoute {
  direction: Direction;
  movement: ActionMovementCadence;
}

export function nextLeafRoute(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
  launchDirection: Direction | null,
): LeafRoute | null {
  const candidates = leafRouteCandidates(query, entity, launchDirection);
  const direction = candidates.find((candidate) =>
    canEnterLeafDomain(
      query,
      entity,
      addDirection(entity.anchor, candidate),
      candidate,
    )
  );
  return direction
    ? { direction, movement: leafMovementFor(query, entity) }
    : null;
}

/**
 * motion 到达与 Action 结算位于同一 tick 的不同阶段。前方载体正在
 * 决定续行或停止时，Leaf 需要保留 Action 到下一 tick 再重试。
 */
export function leafRouteAwaitsMovingSupportSettlement(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
  launchDirection: Direction | null,
): boolean {
  return leafRouteCandidates(query, entity, launchDirection).some(
    (direction) =>
      query.presencesAt(addDirection(entity.anchor, direction)).some(
        (presence) => {
          if (presence.entityId === entity.id) return false;
          const occupant = query.entity(presence.entityId);
          if (
            occupant?.type !== MapEntityTypeId.CLOUD &&
            occupant?.type !== MapEntityTypeId.LEAF
          )
            return false;
          return occupant.direction === direction &&
            occupant.state?.moving === true &&
            query.motionForEntity(occupant.id)?.status !== "running";
        },
      ),
  );
}

export function leafMovementFor(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
): ActionMovementCadence {
  return query.hasSelectorAt(entity.anchor, {
    kind: "type",
    value: MapEntityTypeId.WATERFALL,
  })
    ? LEAF_MOVEMENT.waterfall
    : LEAF_MOVEMENT.normal;
}

export function hasLeafAutomaticCurrent(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
): boolean {
  return query.hasSelectorAt(entity.anchor, {
    kind: "type",
    value: MapEntityTypeId.TIDE,
  }) ||
    query.hasSelectorAt(entity.anchor, {
      kind: "type",
      value: MapEntityTypeId.WATERFALL,
    });
}

export function tideDirectionAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
): Direction | null {
  for (const presence of query.presencesAt(cell)) {
    const entity = query.entity(presence.entityId);
    if (entity?.type !== MapEntityTypeId.TIDE) continue;
    return directionState(entity.direction);
  }
  return null;
}

function leafDirectionAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  fallback: Direction,
): Direction {
  return tideDirectionAt(query, cell) ??
    (query.hasSelectorAt(cell, {
      kind: "type",
      value: MapEntityTypeId.WATERFALL,
    })
      ? "down"
      : fallback);
}

function leafRouteCandidates(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
  launchDirection: Direction | null,
): readonly Direction[] {
  const currentDirection = directionState(entity.direction) ?? "right";
  const preferredDirection =
    launchDirection ?? leafDirectionAt(query, entity.anchor, currentDirection);

  // 只有正在漂流的 Leaf 才能在水流改向受阻后沿原方向续行。
  // 停在 Tide / Waterfall 上时必须等待水流前方清空，不能把默认朝向当成退路。
  return entity.state?.moving === true
    ? [preferredDirection, currentDirection]
    : [preferredDirection];
}

function canEnterLeafDomain(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
  target: { x: number; y: number },
  direction: Direction,
): boolean {
  if (!query.inBounds(target)) return false;
  // 原版分别读取 terrain 与 object；Beanstalk 等 contact-cover 不应隐藏底层水域。
  if (
    !query.allPresencesAt(target).some((presence) =>
      presence.facts.includes("water")
    )
  )
    return false;
  if (movingSupportOccupiedAt(query, entity, target, direction)) return false;

  for (const presence of query.presencesAt(target)) {
    const tide = query.entity(presence.entityId);
    if (
      tide?.type === MapEntityTypeId.TIDE &&
      tide.direction === oppositeDirection(direction)
    )
      return false;
  }
  return !(
    direction === "up" &&
    query.hasSelectorAt(target, {
      kind: "type",
      value: MapEntityTypeId.WATERFALL,
    })
  );
}

function directionState(value: unknown): Direction | null {
  return value === "up" ||
      value === "down" ||
      value === "left" ||
      value === "right"
    ? value
    : null;
}
