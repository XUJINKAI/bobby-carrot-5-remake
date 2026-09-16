import { MapEntityTypeId } from "@bobby/model";
import type { GoalDefinition } from "../../../world/outcome/GoalRegistry.js";

export const exitGoal: GoalDefinition = {
  type: "exit",
  available(query) {
    return query.entityCountMatching({ kind: "type", value: MapEntityTypeId.EXIT }) > 0;
  },
  evaluate({ query, reach }) {
    const actors = query.entitiesWithFact("player");
    return {
      completed: actors.length > 0 && actors.every((actor) =>
        reach.actorReaches(actor, {
          kind: "type",
          value: MapEntityTypeId.EXIT,
        })
      ),
    };
  },
};
