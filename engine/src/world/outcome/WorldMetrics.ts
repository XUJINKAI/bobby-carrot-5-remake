import type { FactId } from "../../mechanism/fact/FactRegistry.js";

export interface WorldMetricsQuery {
  entityCountWithFact(fact: FactId): number;
}

/** World 保存通用派生指标；指标的名称和语义由 Mechanism 决定。 */
export interface WorldMetricsMechanism {
  project(query: WorldMetricsQuery): Readonly<Record<string, number>>;
}
