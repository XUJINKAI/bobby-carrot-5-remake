import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import { bobbyMountId } from "../player/BobbyState.js";
import { hasBobbyBridgeAt } from "./terrain-semantics.js";

/** 水域只判断自己的跨越条件；同格独立对象继续执行各自的 canEnter。 */
export const waterPassage: Behavior = {
  id: "water-passage",
  canEnter({ actor, self, query }) {
    if (bobbyMountId(actor.state) !== null) {
      return { passable: false, reason: "mower-cannot-enter-water" };
    }
    const supported = hasBobbyBridgeAt(query, self.presence.cell) ||
      query.presencesAt(self.presence.cell).some((presence) => {
        const type = query.entity(presence.entityId)?.type;
        return type === MapEntityTypeId.CLOUD || type === MapEntityTypeId.LEAF;
      });
    return supported
      ? { passable: true, reason: "water-support" }
      : { passable: false, reason: "water-requires-support" };
  },
};
