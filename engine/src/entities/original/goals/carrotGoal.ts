import { MapEntityTypeId } from "@bobby/model";
import type { GoalDefinition } from "../../../world/outcome/GoalRegistry.js";

export const carrotGoal: GoalDefinition = {
  type: "carrot",
  available(query) {
    return query.entityCountMatching({ kind: "type", value: MapEntityTypeId.CARROT }) > 0;
  },
  evaluate({ query }) {
    const remaining = query.entitiesMatching({
      kind: "type",
      value: MapEntityTypeId.CARROT,
    }).filter((entity) => entity.state?.consumed !== true).length;
    return { completed: remaining === 0, remaining };
  },
};
