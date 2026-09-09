import type { LevelMap } from "@bobby/model";
import {
  GameplaySession,
  type GameplaySessionOptions,
} from "../core/GameplaySession.js";
import type { WorldIntentGroup } from "../world/movement/WorldIntent.js";
import {
  type Replay,
  type ReplayInputGroup,
} from "./ReplayFormat.js";
import { validateReplay } from "./ReplayValidation.js";

export interface ReplayReport {
  actual: {
    status: "playing" | "won" | "dead";
    moves: number;
    endTick: number;
  };
}

export type ReplayRunOptions = Pick<
  GameplaySessionOptions,
  "profile" | "economy"
>;

/** Replay 每次从 LevelMap 起点执行，不读取或保存中途 WorldSnapshot。 */
export function runReplay(
  level: LevelMap,
  replay: Replay,
  options: ReplayRunOptions = {},
): ReplayReport {
  const session = new GameplaySession({
    ...options,
    timing: { worldHz: replay.runtime.worldHz },
    bobbyLocomotion: replay.runtime.bobbyLocomotion,
    history: { mode: "disabled" },
  });
  session.loadLevel(level);
  validateReplay(session.actorIds, session.bobbyLocomotion, replay);
  const frames = new Map(replay.frames.map((frame) => [frame.tick, frame]));
  session.advanceTicks(replay.endTick, (time) => ({
    groups: replayInputGroups(frames.get(time.tick)?.groups ?? []),
  }));

  const actual = {
    status: session.state.status,
    moves: session.state.moves,
    endTick: session.clock.tickCount,
  };
  return { actual };
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
