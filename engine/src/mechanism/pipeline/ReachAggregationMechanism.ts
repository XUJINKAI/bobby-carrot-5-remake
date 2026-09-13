import type { ReachAggregationMechanism } from "../../world/outcome/ReachAggregation.js";

export const reachAggregationMechanism: ReachAggregationMechanism = {
  forSelector(query, selector) {
    const requiresAll = query.entitiesWithFact("reach-all-players")
      .some((entity) => query.presencesForEntity(entity.id)
        .some((presence) => query.presenceMatchesSelector(presence, selector)));
    return requiresAll ? "all" : "any";
  },
};
