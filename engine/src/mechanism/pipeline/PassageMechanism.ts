import type { PassagePipelineMechanism } from "../../world/movement/MovementPipeline.js";

/** 标准通行只解释当前格 Presence 的空间 Fact。 */
export const passageMechanism: PassagePipelineMechanism = {
  id: "standard-passage",
  isWalkable(stack) {
    return stack.some((presence) => presence.facts.includes("walkable"));
  },
  isBlocking(presence) {
    return presence.facts.includes("blocking");
  },
};
