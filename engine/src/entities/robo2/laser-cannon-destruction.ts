import { MapEntityTypeId, type Direction } from "@bobby/model";
import type { RuntimeActionDefinition } from "../../world/action/RuntimeAction.js";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  EntityId,
  EntityInstance,
} from "../../world/entity/EntityInstance.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";

const LASER_CANNON_DESTRUCTION_ACTION = "laser-cannon-destruction";

export const LASER_CANNON_FLASH_COUNT = 6;
export const LASER_CANNON_FLASH_INTERVAL_MS = 60;
export const LASER_CANNON_FLASH_DURATION_MS =
  LASER_CANNON_FLASH_COUNT * 2 * LASER_CANNON_FLASH_INTERVAL_MS;

export const laserCannonDestructionAction: RuntimeActionDefinition = {
  kind: LASER_CANNON_DESTRUCTION_ACTION,
  update({ action, time, query, commands }) {
    const cannonId = action.ownerEntityId;
    const cannon = cannonId === undefined ? undefined : query.entity(cannonId);
    if (
      cannon?.type !== MapEntityTypeId.LASER_CANNON ||
      cannon.state?.destroying !== true
    ) {
      return "complete";
    }
    const elapsedMs = finiteNumber(action.state.elapsedMs) + time.stepMs;
    action.state.elapsedMs = elapsedMs;
    if (elapsedMs < LASER_CANNON_FLASH_DURATION_MS) return "running";
    commands.destroy(cannon.id);
    return "complete";
  },
};

export interface LaserCannonFlashSegment {
  cell: { x: number; y: number };
  direction: Direction;
  outgoingDirection?: Direction;
  terminal: boolean;
}

export function groupLaserBeamsBySource(
  query: WorldQueryApi,
): ReadonlyMap<EntityId, readonly Readonly<EntityInstance>[]> {
  const result = new Map<EntityId, Readonly<EntityInstance>[]>();
  const beams = query.entitiesMatching({
    kind: "type",
    value: RuntimeEntityTypeId.LASER_BEAM,
  });
  for (const beam of beams) {
    const sourceId = beam.state?.sourceId;
    if (typeof sourceId !== "number") continue;
    const group = result.get(sourceId) ?? [];
    group.push(beam);
    result.set(sourceId, group);
  }
  return result;
}

export function flashSegmentsFromBeams(
  beams: readonly Readonly<EntityInstance>[],
): readonly LaserCannonFlashSegment[] {
  return [...beams]
    .sort((left, right) => left.id - right.id)
    .map((beam) => ({
      cell: beam.anchor,
      direction: beam.direction ?? "right",
      terminal: beam.state?.terminal === true,
      ...(isDirection(beam.state?.outgoingDirection)
        ? { outgoingDirection: beam.state.outgoingDirection }
        : {}),
    }));
}

export function beginLaserCannonDestruction(
  commands: WorldCommandApi,
  cannon: Readonly<EntityInstance>,
  beams: readonly Readonly<EntityInstance>[],
  ray: readonly LaserCannonFlashSegment[],
): void {
  if (cannon.state?.destroying === true) return;
  commands.emit({
    type: "laser-cannon-destroyed",
    entityId: cannon.id,
    x: cannon.anchor.x,
    y: cannon.anchor.y,
    direction: cannon.direction ?? "right",
    data: {
      segments: ray.map((segment) => ({
        x: segment.cell.x - cannon.anchor.x,
        y: segment.cell.y - cannon.anchor.y,
        direction: segment.direction,
        terminal: segment.terminal,
        ...(segment.outgoingDirection
          ? { outgoingDirection: segment.outgoingDirection }
          : {}),
      })),
    },
  });
  for (const beam of beams) commands.destroy(beam.id);
  // 损毁阶段仍占据原格并截断光路，完整时序见 docs/reference/robo2.md。
  commands.setState(cannon.id, {
    ...cannon.state,
    destroying: true,
  });
  commands.startAction({
    kind: LASER_CANNON_DESTRUCTION_ACTION,
    ownerEntityId: cannon.id,
    state: { elapsedMs: 0 },
  });
}

function isDirection(value: unknown): value is Direction {
  return value === "up" || value === "right" ||
    value === "down" || value === "left";
}

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
