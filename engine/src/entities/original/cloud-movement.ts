import {
  MapEntityTypeId,
  type Direction,
  type JsonValue,
} from "@bobby/model";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityInstance } from "../../world/entity/EntityInstance.js";
import {
  CLOUD_MOVEMENT,
  type ActionMovementCadence,
} from "../movement/MovementCadence.js";
import {
  addDirection,
  movingSupportOccupiedAt,
  oppositeDirection,
} from "./moving-platform-collision.js";

export interface CloudRoute {
  direction: Direction;
  movement: ActionMovementCadence;
  windFocusHandoff: boolean;
}

export function nextCloudRoute(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
): CloudRoute | null {
  const currentDirection = directionState(entity.direction) ?? "right";
  const windDirections = activeWindDirectionsAt(
    query,
    entity.anchor,
    entity.state?.moving === true ? currentDirection : null,
  );
  const candidates = [
    ...windDirections,
    ...(entity.state?.moving === true ? [currentDirection] : []),
  ];
  const direction = candidates.find((candidate) =>
    canEnterCloudDomain(
      query,
      entity,
      addDirection(entity.anchor, candidate),
      candidate,
    )
  );
  if (!direction) return null;
  return {
    direction,
    movement: CLOUD_MOVEMENT,
    windFocusHandoff:
      windDirections.includes(direction) && windFocusPending(query, direction),
  };
}

export function consumeWindFocusPending(
  query: WorldQueryApi,
  commands: WorldCommandApi,
  direction: Direction,
): void {
  for (const entity of query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WIND_SWITCH,
  })) {
    if (
      entity.direction !== direction ||
      entity.state?.windFocusPending !== true
    )
      continue;
    commands.setState(entity.id, {
      ...entity.state,
      windFocusPending: false,
    });
  }
}

export function isMatchingCloudParking(
  query: WorldQueryApi,
  cloud: Readonly<EntityInstance>,
): boolean {
  const color = cloudColor(cloud.state?.color);
  return query.presencesAt(cloud.anchor).some((presence) => {
    const parking = query.entity(presence.entityId);
    return parking?.type === MapEntityTypeId.CLOUD_PARKING &&
      cloudColor(parking.state?.color) === color;
  });
}

export function cloudColor(
  value: JsonValue | undefined,
): "red" | "purple" | "green" {
  return value === "purple" || value === "green" ? value : "red";
}

function canEnterCloudDomain(
  query: WorldQueryApi,
  entity: Readonly<EntityInstance>,
  target: { x: number; y: number },
  direction: Direction,
): boolean {
  if (!query.inBounds(target)) return false;
  // 原版分别读取 terrain 与 object；contact-cover 不应隐藏底层天空移动域。
  if (
    !query.allPresencesAt(target).some((presence) =>
      presence.facts.includes("sky")
    )
  )
    return false;
  if (movingSupportOccupiedAt(query, entity, target, direction)) return false;
  return !windAppliesAt(query, target, oppositeDirection(direction));
}

function activeWindDirectionsAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  currentDirection: Direction | null,
): Direction[] {
  const directions: readonly Direction[] = ["up", "down", "left", "right"];
  return directions.filter(
    (direction) =>
      direction !== currentDirection &&
      windAppliesAt(query, cell, direction, true),
  );
}

function windFocusPending(query: WorldQueryApi, direction: Direction): boolean {
  return query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WIND_SWITCH,
  }).some(
    (entity) =>
      entity.direction === direction &&
      entity.state?.active === true &&
      entity.state.windFocusPending === true,
  );
}

function windAppliesAt(
  query: WorldQueryApi,
  cell: { x: number; y: number },
  direction: Direction,
  requireReady = false,
): boolean {
  if (!windEnabled(query, direction, requireReady)) return false;
  return windmillsFor(query, direction).some((windmill) =>
    insideWindRange(cell, windmill.anchor, direction)
  );
}

function windEnabled(
  query: WorldQueryApi,
  direction: Direction,
  requireReady: boolean,
): boolean {
  return query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WIND_SWITCH,
  }).some(
    (entity) =>
      entity.type === MapEntityTypeId.WIND_SWITCH &&
      entity.direction === direction &&
      entity.state?.active === true &&
      (!requireReady || entity.state.windPending !== true),
  );
}

function windmillsFor(
  query: WorldQueryApi,
  direction: Direction,
): readonly Readonly<EntityInstance>[] {
  return query.entitiesMatching({
    kind: "type",
    value: MapEntityTypeId.WINDMILL,
  }).filter(
    (entity) =>
      entity.type === MapEntityTypeId.WINDMILL &&
      entity.direction === direction,
  );
}

function insideWindRange(
  cell: { x: number; y: number },
  windmill: { x: number; y: number },
  direction: Direction,
): boolean {
  if (direction === "up")
    return cell.x === windmill.x &&
      cell.y >= windmill.y - 3 &&
      cell.y < windmill.y;
  if (direction === "down")
    return cell.x === windmill.x &&
      cell.y > windmill.y &&
      cell.y <= windmill.y + 3;
  if (direction === "left")
    return cell.y === windmill.y &&
      cell.x >= windmill.x - 3 &&
      cell.x < windmill.x;
  return cell.y === windmill.y &&
    cell.x > windmill.x &&
    cell.x <= windmill.x + 3;
}

function directionState(value: unknown): Direction | null {
  return value === "up" ||
      value === "down" ||
      value === "left" ||
      value === "right"
    ? value
    : null;
}
