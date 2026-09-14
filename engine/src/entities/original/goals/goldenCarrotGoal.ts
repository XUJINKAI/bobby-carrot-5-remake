import { MapEntityTypeId } from "@bobby/model";
import type { GoalDefinition } from "../../../world/outcome/GoalRegistry.js";

export const goldenCarrotGoal: GoalDefinition = {
  type: "golden-carrot",
  available(query) {
    return query.entityCountMatching({ kind: "type", value: MapEntityTypeId.GOLDEN_CARROT }) > 0;
  },
  evaluate({ successfulInteractions }) {
    return {
      completed: successfulInteractions.includes(MapEntityTypeId.GOLDEN_CARROT),
    };
  },
};
