import { MapEntityTypeId, type Direction } from "@bobby/model";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityInstance } from "../../world/entity/EntityInstance.js";

/** 原版移动平台之间及其与固定障碍之间的占位规则。 */
export function movingSupportOccupiedAt(
  query: WorldQueryApi,
  mover: Readonly<EntityInstance>,
  target: { x: number; y: number },
  direction: Direction,
): boolean {
  return query.presencesAt(target).some((presence) => {
    if (presence.entityId === mover.id) return false;
    const occupant = query.entity(presence.entityId);
    if (!occupant) return false;
    if (
      occupant.type === MapEntityTypeId.PLANK ||
      occupant.type === MapEntityTypeId.ICE_BLOCK ||
      occupant.type === MapEntityTypeId.CRUMBLY_ROCK ||
      occupant.type === MapEntityTypeId.FENCE
    )
      return true;
    if (
      occupant.type === MapEntityTypeId.CLOUD ||
      occupant.type === MapEntityTypeId.LEAF
    ) {
      // 同向运行中的载体先作为候选路线交给 World；其持续目的格 reservation
      // 会阻止后车追入。已经结算停止的载体则在对象规则中直接阻挡。
      const occupantMotion = query.motionForEntity(occupant.id);
      return occupant.direction !== direction ||
        occupantMotion?.status !== "running";
    }
    return false;
  });
}

export function addDirection(
  cell: { x: number; y: number },
  direction: Direction,
): { x: number; y: number } {
  if (direction === "up") return { x: cell.x, y: cell.y - 1 };
  if (direction === "down") return { x: cell.x, y: cell.y + 1 };
  if (direction === "left") return { x: cell.x - 1, y: cell.y };
  return { x: cell.x + 1, y: cell.y };
}

export function oppositeDirection(direction: Direction): Direction {
  return { up: "down", down: "up", left: "right", right: "left" }[
    direction
  ] as Direction;
}
