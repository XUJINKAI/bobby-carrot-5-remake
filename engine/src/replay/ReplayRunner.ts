import type { LevelMap } from "@bobby/model";
import { GameplaySession } from "../core/GameplaySession.js";
import type { WorldIntentGroup } from "../world/movement/WorldIntent.js";
import {
  replayLevelHash,
  replayValueHash,
  type Replay,
  type ReplayInputGroup,
} from "./ReplayFormat.js";

export interface ReplayReport {
  passed: boolean;
  actual: {
    status: "playing" | "won" | "dead";
    moves: number;
    stateHash: string;
    endTick: number;
  };
  errors: string[];
}

/** Replay 每次从 LevelMap 起点执行，不读取或保存中途 WorldSnapshot。 */
export function runReplay(level: LevelMap, replay: Replay): ReplayReport {
  const errors: string[] = [];
  const levelHash = replayLevelHash(level);
  if (levelHash !== replay.levelHash)
    errors.push(`地图指纹不匹配：期待 ${replay.levelHash}，实际 ${levelHash}`);

  const session = new GameplaySession({
    profile: replay.runtime.profile,
    economy: replay.runtime.economy,
    timing: { worldHz: replay.runtime.worldHz },
    bobbyLocomotion: replay.runtime.bobbyLocomotion,
    history: { mode: "disabled" },
  });
  session.loadLevel(level);
  const frames = new Map(replay.frames.map((frame) => [frame.tick, frame]));
  session.advanceTicks(replay.endTick, (time) => ({
    groups: replayInputGroups(frames.get(time.tick)?.groups ?? []),
  }));

  const actual = {
    status: session.state.status,
    moves: session.state.moves,
    stateHash: replayValueHash(session.world.snapshot()),
    endTick: session.clock.tickCount,
  };
  if (actual.status !== replay.expectation.status)
    errors.push(
      `终局状态不匹配：期待 ${replay.expectation.status}，实际 ${actual.status}`,
    );
  if (actual.moves !== replay.expectation.moves)
    errors.push(
      `移动计数不匹配：期待 ${replay.expectation.moves}，实际 ${actual.moves}`,
    );
  if (actual.stateHash !== replay.expectation.stateHash)
    errors.push(
      `状态指纹不匹配：期待 ${replay.expectation.stateHash}，实际 ${actual.stateHash}`,
    );
  return { passed: errors.length === 0, actual, errors };
}

export function replayInputGroups(
  groups: readonly ReplayInputGroup[],
): WorldIntentGroup[] {
  return groups.map(fromReplayInputGroup);
}

function fromReplayInputGroup(group: ReplayInputGroup): WorldIntentGroup {
  return {
    historyBoundary: true,
    intents: group.intents.map((intent) => ({
      type: "move",
      actorId: intent.actorId,
      direction: intent.direction,
      cause: { type: "player-input", source: intent.source ?? "replay" },
    })),
  };
}
