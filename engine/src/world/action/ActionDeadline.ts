import type { JsonValue } from "@bobby/model";
import type { WorldTick } from "../../time/WorldClock.js";
import type { RuntimeActionInstance } from "./RuntimeAction.js";

/**
 * 连续 Action 的 deadline 在 WorldMotion 运行期间仍然前进。这样上一段 motion
 * 完成时，下一段可以在同一个 World tick 接续，而不是完成后重新等待一整格。
 */
export function accrueActionDeadline(
  action: RuntimeActionInstance,
  time: WorldTick,
): number {
  const elapsedMs = finiteNumber(action.state.elapsedMs) + time.stepMs;
  action.state.elapsedMs = elapsedMs;
  return elapsedMs;
}

/** 到期时消费一个周期；保留超出的固定步长余量。 */
export function consumeActionDeadline(
  action: RuntimeActionInstance,
  cadenceMs: number,
  toleranceMs = 0,
): boolean {
  const cadence = positiveNumber(cadenceMs);
  const elapsedMs = finiteNumber(action.state.elapsedMs);
  if (elapsedMs + Math.max(0, toleranceMs) < cadence) return false;
  action.state.elapsedMs = Math.max(0, elapsedMs - cadence);
  return true;
}

/**
 * midpoint 接管已有 motion 时，预先计入“已等待”的部分；motion 抵达时 deadline
 * 恰好到期。没有进行中的 motion 时返回完整 cadence，表示下一 tick 可立即启动。
 */
export function primeDeadlineForHandoff(
  cadenceMs: number,
  motion:
    | { durationMs: number; progress: number }
    | null
    | undefined,
): number {
  const cadence = positiveNumber(cadenceMs);
  if (!motion) return cadence;
  const durationMs = Math.max(0, finiteNumber(motion.durationMs));
  const progress = Math.max(0, Math.min(1, finiteNumber(motion.progress)));
  const remainingMs = durationMs * (1 - progress);
  return Math.max(0, cadence - remainingMs);
}

function finiteNumber(value: JsonValue | number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function positiveNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
