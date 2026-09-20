import type { Behavior } from "../../world/behavior/Behavior.js";

type MovingPlatformHooks = Pick<Behavior, "onArrive" | "onTick">;

/** 移动平台携带同格玩家，但步行进入不建立驾驶关系。 */
export function createMovingPlatformSupportBehavior(
  hooks: MovingPlatformHooks = {},
): Behavior {
  return {
    id: "moving-platform-support",
    planMovement({ actor, query, to }) {
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
