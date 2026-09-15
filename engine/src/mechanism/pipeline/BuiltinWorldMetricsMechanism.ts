import type { WorldMetricsMechanism } from "../../world/outcome/WorldMetrics.js";

/** 奖励指标按对象 Type 计数，空间索引按 Entity ID 去重。 */
export const builtinWorldMetricsMechanism: WorldMetricsMechanism = {
  project(query) {
    return {
      "golden-carrot": query.entityCountMatching({ kind: "type", value: "golden-carrot" }),
      "bonus-coin": query.entityCountMatching({ kind: "type", value: "bonus-coin" }),
    };
  },
};
