import type { Direction } from "@bobby/model";
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

export interface ReplaySetActorLockKeyIntent {
  type: "set-actor-lock-key";
  /** 单 Bobby 地图省略；多 Bobby 地图使用动作发生时的 anchor。 */
  actor?: CellPosition;
  kind: "single-use" | "reusable";
  enabled: boolean;
}

export interface ReplaySetActorLocomotionIntent {
  type: "set-actor-locomotion";
  actor?: CellPosition;
  moveDurationMs: number;
}

export type ReplayGameplayIntent =
  | ReplayMoveIntent
  | ReplaySetActorLockKeyIntent
  | ReplaySetActorLocomotionIntent;

export type ReplayInitialIntent =
  | ReplaySetActorLockKeyIntent
  | ReplaySetActorLocomotionIntent;

export interface ReplayInputGroup {
  intents: ReplayGameplayIntent[];
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

export type ReplayCompletedCondition =
  | { type: "collect-all"; target: string }
  | { type: "fill-all"; target: string; filler: string }
  | { type: "reach"; target: string };

export interface ReplayActualFinalState {
  status: ReplayFinalStatus;
  moves: number;
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
  initialIntents: ReplayInitialIntent[];
  finalState: ReplayFinalState;
  endTick: number;
  frames: ReplayFrame[];
}
