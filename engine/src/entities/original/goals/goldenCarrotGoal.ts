import { MapEntityTypeId } from "@bobby/model";
import type { GoalDefinition } from "../../../world/outcome/GoalRegistry.js";

export const goldenCarrotGoal: GoalDefinition = {
  type: "golden-carrot",
  available(query) {
    return query.entityCountMatching({ kind: "type", value: MapEntityTypeId.GOLDEN_CARROT }) > 0;
  },
  evaluate({ successfulGoalInteractions }) {
    // Golden Carrot 收集时会被消费；已提交的交互记录保留本局达标事实。
    return {
      completed: successfulGoalInteractions.includes(MapEntityTypeId.GOLDEN_CARROT),
    };
  },
};
