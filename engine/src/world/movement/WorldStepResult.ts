import type { Direction } from "@bobby/model";
import type { RuntimeActionId } from "../action/RuntimeAction.js";
import type { CellPosition, EntityId } from "../entity/EntityInstance.js";
import type { MoveCause } from "./WorldIntent.js";
import type { MoveResult, WorldEvent } from "../WorldTypes.js";
import type { WorldDelta } from "../delta/WorldDelta.js";
import type { WorldMotion } from "./WorldMotion.js";

export type EntityMotion = WorldMotion;

export interface EntityMotionRequest {
  entityId: EntityId;
  from: CellPosition;
  to: CellPosition;
  direction: Direction;
  cause: MoveCause;
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
  /** 本次推进新启动的空间过程；完整因果顺序以 deltas 为准。 */
  motions: WorldMotion[];
  events: WorldEvent[];
  mutations: WorldMutationSummary;
  deltas: WorldDelta[];
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

export function emptyWorldStepResult(): WorldStepResult {
  return {
    moves: [],
    motions: [],
    events: [],
    mutations: emptyMutationSummary(),
    deltas: [],
  };
}

/** Merge one phase result into the aggregate WorldTick result. */
export function mergeWorldStepResult(
  target: WorldStepResult,
  source: WorldStepResult,
): void {
  target.moves.push(...source.moves.map((move) => structuredClone(move)));
  target.motions.push(...source.motions.map((motion) => structuredClone(motion)));
  target.events.push(...source.events.map((event) => structuredClone(event)));
  target.deltas.push(...source.deltas.map((delta) => structuredClone(delta)));
  mergeWorldMutationSummary(target.mutations, source.mutations);
}

export function mergeWorldMutationSummary(
  target: WorldMutationSummary,
  source: WorldMutationSummary,
): void {
  for (const value of source.moved) pushUnique(target.moved, value);
  for (const value of source.stateChanged) pushUnique(target.stateChanged, value);
  for (const value of source.spawned) pushUnique(target.spawned, value);
  for (const value of source.destroyed) pushUnique(target.destroyed, value);
  for (const value of source.globalsChanged) pushUnique(target.globalsChanged, value);
  for (const value of source.actionsStarted) pushUnique(target.actionsStarted, value);
  for (const value of source.actionsCancelled) pushUnique(target.actionsCancelled, value);
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

function pushUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value);
}
