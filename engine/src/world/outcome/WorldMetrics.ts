import type { EntitySelector } from "../spatial/EntitySelector.js";

export interface WorldMetricsQuery {
  entityCountMatching(selector: EntitySelector): number;
}

/** World 保存通用派生指标；指标的名称和语义由 Mechanism 决定。 */
export interface WorldMetricsMechanism {
  project(query: WorldMetricsQuery): Readonly<Record<string, number>>;
}
