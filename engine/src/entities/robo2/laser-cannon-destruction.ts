import type { Direction } from "@bobby/model";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  EntityId,
  EntityInstance,
} from "../../world/entity/EntityInstance.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";

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

export function destroyLaserCannon(
  commands: WorldCommandApi,
  cannon: Readonly<EntityInstance>,
  beams: readonly Readonly<EntityInstance>[],
  ray: readonly LaserCannonFlashSegment[],
): void {
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
  commands.destroy(cannon.id);
}

function isDirection(value: unknown): value is Direction {
  return value === "up" || value === "right" ||
    value === "down" || value === "left";
}
