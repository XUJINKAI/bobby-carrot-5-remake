import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { EntitySelector } from "../spatial/EntitySelector.js";

export type ReachAggregation = "any" | "all";

/** World 只使用聚合结果；目标自身的 gameplay Fact 由 Mechanism 解释。 */
export interface ReachAggregationMechanism {
  forSelector(
    query: WorldQueryApi,
    selector: EntitySelector,
  ): ReachAggregation;
}
