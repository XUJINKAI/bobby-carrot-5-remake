import type { Direction } from "@bobby/model";
import type { WorldCommandApi } from "../../world/behavior/CommandQueue.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type {
  EntityId,
  EntityInstance,
} from "../../world/entity/EntityInstance.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";

export interface LaserEmitterFlashSegment {
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
): readonly LaserEmitterFlashSegment[] {
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

export function destroyLaserEmitter(
  commands: WorldCommandApi,
  emitter: Readonly<EntityInstance>,
  beams: readonly Readonly<EntityInstance>[],
  ray: readonly LaserEmitterFlashSegment[],
): void {
  commands.emit({
    type: "laser-emitter-destroyed",
    entityId: emitter.id,
    x: emitter.anchor.x,
    y: emitter.anchor.y,
    direction: emitter.direction ?? "right",
    data: {
      segments: ray.map((segment) => ({
        x: segment.cell.x - emitter.anchor.x,
        y: segment.cell.y - emitter.anchor.y,
        direction: segment.direction,
        terminal: segment.terminal,
        ...(segment.outgoingDirection
          ? { outgoingDirection: segment.outgoingDirection }
          : {}),
      })),
    },
  });
  for (const beam of beams) commands.destroy(beam.id);
  commands.destroy(emitter.id);
}

function isDirection(value: unknown): value is Direction {
  return value === "up" || value === "right" ||
    value === "down" || value === "left";
}
