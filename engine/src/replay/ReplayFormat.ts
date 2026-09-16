import type { Direction, GoalType } from "@bobby/model";
import type { BobbyLocomotionTiming } from "../entities/player/BobbyLocomotion.js";
import type { CellPosition } from "../world/entity/EntityInstance.js";

export const REPLAY_FORMAT_VERSION = 1;

export interface ReplayMoveIntent {
  type: "move";
  direction: Direction;
  /** 省略表示 controller channel 0。 */
  channel?: number;
  /** 仅用于绕过 controller 的单 actor 调试移动。 */
  actor?: CellPosition;
}

export interface ReplayInputGroup {
  intents: ReplayMoveIntent[];
}

export interface ReplayFrame {
  tick: number;
  groups: ReplayInputGroup[];
}

export interface ReplayRuntimeSetup {
  worldHz: number;
  bobbyLocomotion: BobbyLocomotionTiming;
}

export type ReplayFinalStatus = "playing" | "won" | "dead";

export interface ReplayRecordingMeta {
  id: string;
  url: string;
}

export interface ReplayMeta extends ReplayRecordingMeta {
  note: string;
}

export function isReplayPathId(value: unknown): value is string {
  return typeof value === "string" && /^[^/\s]+\/[^/\s]+$/.test(value);
}

export type ReplayCompletedCondition = { type: GoalType };

export interface ReplayActualFinalState {
  status: ReplayFinalStatus;
  moves: number;
  /** 按 GameplaySession actor 顺序记录所有 Bobby 的最终 anchor。 */
  position: CellPosition[];
  /** 仅记录本局 World 时间，不参与 Replay 结果一致性校验。 */
  elapsedMs: number;
  counters: Record<string, number>;
  completedConditions: ReplayCompletedCondition[];
}

/** Replay 文件可以只声明需要长期验证的终局字段。 */
export type ReplayFinalState = Partial<ReplayActualFinalState>;

export interface Replay {
  formatVersion: typeof REPLAY_FORMAT_VERSION;
  meta: ReplayMeta;
  runtime: ReplayRuntimeSetup;
  finalState: ReplayFinalState;
  endTick: number;
  frames: ReplayFrame[];
}
