import type { EntityId } from "../world/entity/EntityInstance.js";
import type { WorldStepResult } from "../world/movement/WorldStepResult.js";

export type HistoryMode = "every-intent" | "world-change" | "disabled";

export interface HistoryPolicy {
  mode: HistoryMode;
}

export const DEFAULT_HISTORY_POLICY: HistoryPolicy = {
  mode: "world-change",
};

const NON_CHECKPOINT_GLOBALS = new Set([
  "moves",
  "elapsedMs",
  "lastReachedSelectors",
  "logicRemainderMs",
]);

/**
 * Snapshot 始终是完整 WorldSnapshot；这里只决定是否把 step 前快照写进 history。
 * world-change 忽略 controlled actor 的纯位移/方向与计步等 housekeeping 状态。
 */
export function shouldCheckpoint(
  policy: HistoryPolicy,
  result: WorldStepResult,
  controlledActorIds: readonly EntityId[],
): boolean {
  if (policy.mode === "disabled") return false;
  if (policy.mode === "every-intent") return result.moves.length > 0;

  const controlled = new Set(controlledActorIds);
  const mutation = result.mutations;
  if (
    mutation.stateChanged.length > 0 ||
    mutation.spawned.length > 0 ||
    mutation.destroyed.length > 0 ||
    mutation.actionsStarted.length > 0 ||
    mutation.actionsCancelled.length > 0 ||
    mutation.globalsChanged.some((key) => !NON_CHECKPOINT_GLOBALS.has(key))
  )
    return true;
  return mutation.moved.some((entityId) => !controlled.has(entityId));
}
