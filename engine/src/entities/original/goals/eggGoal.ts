import { MapEntityTypeId } from "@bobby/model";
import type { GoalDefinition } from "../../../world/outcome/GoalRegistry.js";

export const eggGoal: GoalDefinition = {
  type: "egg",
  available(query) {
    return query.entityCountMatching({ kind: "type", value: MapEntityTypeId.EGG }) > 0;
  },
  evaluate({ query }) {
    const eggs = query.entitiesMatching({ kind: "type", value: MapEntityTypeId.EGG });
    const remaining = eggs.filter((egg) => egg.state?.filled !== true).length;
    return { completed: eggs.length > 0 && remaining === 0, remaining };
  },
};
