import type { Direction } from "@bobby/model";
import type { RuntimeActionId } from "../action/RuntimeAction.js";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { MoveResult, WorldEvent } from "../WorldTypes.js";

export interface EntityMotion {
  entityId: EntityId;
  from: CellPosition;
  to: CellPosition;
  direction: Direction;
}

export interface WorldMutationSummary {
  moved: EntityId[];
  stateChanged: EntityId[];
  spawned: EntityId[];
  destroyed: EntityId[];
  globalsChanged: string[];
  actionsStarted: RuntimeActionId[];
  actionsCancelled: RuntimeActionId[];
}

export interface WorldStepResult {
  moves: MoveResult[];
  motions: EntityMotion[];
  events: WorldEvent[];
  mutations: WorldMutationSummary;
}

export function emptyMutationSummary(): WorldMutationSummary {
  return {
    moved: [],
    stateChanged: [],
    spawned: [],
    destroyed: [],
    globalsChanged: [],
    actionsStarted: [],
    actionsCancelled: [],
  };
}

export function hasWorldMutation(summary: WorldMutationSummary): boolean {
  return (
    summary.moved.length > 0 ||
    summary.stateChanged.length > 0 ||
    summary.spawned.length > 0 ||
    summary.destroyed.length > 0 ||
    summary.globalsChanged.length > 0 ||
    summary.actionsStarted.length > 0 ||
    summary.actionsCancelled.length > 0
  );
}
