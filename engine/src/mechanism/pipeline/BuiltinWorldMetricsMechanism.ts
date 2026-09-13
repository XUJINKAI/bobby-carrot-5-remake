import type { WorldMetricsMechanism } from "../../world/outcome/WorldMetrics.js";

/** 奖励对象通过 Fact 提供当前语义；计数按 Entity ID 去重。 */
export const builtinWorldMetricsMechanism: WorldMetricsMechanism = {
  project(query) {
    return {
      "golden-carrot": query.entityCountWithFact("golden-carrot"),
      "bonus-coin": query.entityCountWithFact("bonus-coin"),
    };
  },
};
