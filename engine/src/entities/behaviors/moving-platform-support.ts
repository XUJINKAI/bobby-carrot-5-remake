import type { Direction } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { WorldQueryApi } from "../../world/behavior/WorldQueryApi.js";
import type { EntityId } from "../../world/entity/EntityInstance.js";
import type { MoveCause } from "../../world/movement/WorldIntent.js";

type MovingPlatformHooks = Pick<Behavior, "onArrive" | "onTick">;

/** 移动平台携带同格玩家，但步行进入不建立驾驶关系。 */
export function createMovingPlatformSupportBehavior(
  hooks: MovingPlatformHooks = {},
): Behavior {
  return {
    id: "moving-platform-support",
    planMovement({ actor, cause, direction, query, to }) {
      const timingSourceEntityId = movingPlatformTimingSource(
        actor.id,
        forcedCadenceMs(cause),
        direction,
        to,
        query,
      );
      return {
        passage: "unrestricted",
        lifecycle: { source: [], target: [] },
        companions: query.entitiesWithFact("player")
          .filter(
            (passenger) =>
              passenger.anchor.x === actor.anchor.x &&
              passenger.anchor.y === actor.anchor.y,
          )
          .map((passenger) => ({
            entityId: passenger.id,
            to,
            cause: { type: "carry" as const, carrierId: actor.id },
            updateDirection: false,
          })),
        ...(timingSourceEntityId === null ? {} : { timingSourceEntityId }),
        reason: "moving-platform-passage",
      };
    },
    canEnter({ actor, self, query }) {
      if (!query.entityHasFact(actor.id, "player"))
        return { passable: false, reason: "moving-entity-collision" };

      const moving =
        self.entity.state?.moving === true ||
        query.motionForEntity(self.entity.id)?.status === "running";
      return moving
        ? { passable: false, reason: "moving-entity-in-motion" }
        : { passable: true, reason: "moving-platform-support" };
    },
    canLeave({ actor, query }) {
      return query.entityHasFact(actor.id, "player")
        ? { passable: true, reason: "leave-moving-platform-support" }
        : undefined;
    },
    ...hooks,
  };
}

/** 后车不慢于前车且即将追上时，直接接入前车的连续移动时间线。 */
function movingPlatformTimingSource(
  actorId: EntityId,
  cadenceMs: number | null,
  direction: Direction,
  target: { x: number; y: number },
  query: WorldQueryApi,
): EntityId | null {
  for (const candidate of query.entitiesWithFact("moving-platform")) {
    if (candidate.id === actorId) continue;
    const motion = query.motionForEntity(candidate.id);
    if (
      motion?.status === "running" &&
      motion.direction === direction &&
      motion.from.x === target.x &&
      motion.from.y === target.y &&
      (cadenceMs === null || cadenceMs <= motion.durationMs)
    )
      return candidate.id;
  }
  return null;
}

function forcedCadenceMs(cause: MoveCause): number | null {
  return cause.type === "forced" &&
      cause.cadenceMs !== undefined &&
      Number.isFinite(cause.cadenceMs) &&
      cause.cadenceMs > 0
    ? cause.cadenceMs
    : null;
}
