import type { EntityId } from "../world/entity/EntityInstance.js";
import type { WorldStepResult } from "../world/movement/WorldStepResult.js";

export type HistoryMode = "every-intent" | "world-change" | "disabled";

export interface HistoryPolicy {
  mode: HistoryMode;
}

export const DEFAULT_HISTORY_POLICY: HistoryPolicy = {
  mode: "world-change",
};

/**
 * world-change: 只有 controlled actor 自己的位置/朝向变化不建立 checkpoint；
 * 任何其他 Entity/global/action 变化都建立完整 WorldSnapshot checkpoint。
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
    mutation.globalsChanged.length > 0 ||
    mutation.actionsStarted.length > 0 ||
    mutation.actionsCancelled.length > 0
  )
    return true;
  return mutation.moved.some((entityId) => !controlled.has(entityId));
}
