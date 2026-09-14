import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import { bobbyMountId } from "../player/BobbyState.js";

/** 水域可由同一接触栈中的移动载体支撑。 */
export const waterPassage: Behavior = {
  id: "water-passage",
  canEnter({ actor, self, query }) {
    if (bobbyMountId(actor.state) !== null) {
      return { passable: false, reason: "mower-cannot-enter-water" };
    }
    const supported = query.presencesAt(self.presence.cell).some((presence) => {
      const type = query.entity(presence.entityId)?.type;
      return type === MapEntityTypeId.CLOUD || type === MapEntityTypeId.LEAF;
    });
    return supported
      ? { passable: true, reason: "water-support" }
      : { passable: false, reason: "water-requires-support" };
  },
};
