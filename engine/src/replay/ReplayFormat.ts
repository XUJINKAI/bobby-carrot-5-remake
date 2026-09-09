import type { Direction, LevelMap } from "@bobby/model";
import type { BobbyLocomotionTiming } from "../entities/player/BobbyLocomotion.js";
import type { EconomyState, ProfileCapabilities } from "../world/GlobalState.js";
import type { EntityId } from "../world/entity/EntityInstance.js";

export const REPLAY_FORMAT_VERSION = 1;

export interface ReplayMoveIntent {
  type: "move";
  actorId: EntityId;
  direction: Direction;
  source?: string;
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
  profile: ProfileCapabilities;
  economy: EconomyState;
}

export interface ReplayExpectation {
  status: "playing" | "won" | "dead";
  moves: number;
  stateHash: string;
}

export interface Replay {
  formatVersion: typeof REPLAY_FORMAT_VERSION;
  levelHash: string;
  runtime: ReplayRuntimeSetup;
  frames: ReplayFrame[];
  endTick: number;
  expectation: ReplayExpectation;
}

/** Replay compatibility 使用规范化 JSON 指纹；字段排序使对象构造顺序不影响结果。 */
export function replayValueHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function replayLevelHash(level: LevelMap): string {
  return replayValueHash(level);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
