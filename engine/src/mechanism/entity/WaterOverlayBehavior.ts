import type { Behavior } from "../../world/behavior/Behavior.js";

/** 通用覆盖层通行规则只查询 Presence 语义，不认识具体水面类型。 */
export const waterOverlayBehavior: Behavior = {
  id: "water-requires-overlay",
  canEnter({ query, self }) {
    const supported = query.presencesAt(self.presence.cell).some(
      (presence) =>
        presence.entityId !== self.entity.id &&
        presence.facts.includes("terrain-overlay"),
    );
    return supported
      ? { passable: true, reason: "water-overlay" }
      : { passable: false, reason: "water-requires-overlay" };
  },
};
