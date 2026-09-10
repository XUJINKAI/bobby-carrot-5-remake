import type { Direction } from "@bobby/model";
import type { BobbyLocomotionTiming } from "../entities/player/BobbyLocomotion.js";
import type { EntityId } from "../world/entity/EntityInstance.js";

export const REPLAY_FORMAT_VERSION = 1;

export interface ReplayMoveIntent {
  type: "move";
  actorId: EntityId;
  direction: Direction;
  source?: string;
}

export interface ReplaySetActorLockKeyIntent {
  type: "set-actor-lock-key";
  actorId: EntityId;
  kind: "single-use" | "reusable";
  enabled: boolean;
}

export interface ReplaySetActorLocomotionIntent {
  type: "set-actor-locomotion";
  actorId: EntityId;
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
  name: string;
  url: string;
}

export interface ReplayMeta extends ReplayRecordingMeta {
  final_status: ReplayFinalStatus;
  note: string;
}

export interface Replay {
  formatVersion: typeof REPLAY_FORMAT_VERSION;
  meta: ReplayMeta;
  runtime: ReplayRuntimeSetup;
  initialIntents: ReplayInitialIntent[];
  endTick: number;
  frames: ReplayFrame[];
}
