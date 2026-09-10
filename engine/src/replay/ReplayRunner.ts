import type { LevelMap } from "@bobby/model";
import { GameplaySession } from "../core/GameplaySession.js";
import type { Replay, ReplayFinalState } from "./ReplayFormat.js";
import { ReplayEventCounter } from "./ReplayFinalState.js";
import {
  resolveReplayInitialIntents,
  resolveReplayInputGroups,
} from "./ReplayIntentResolver.js";
import { validateReplay } from "./ReplayValidation.js";

export interface ReplayReport {
  actual: ReplayFinalState;
  endTick: number;
}

/** Replay 每次从 LevelMap 起点执行，不读取或保存中途 WorldSnapshot。 */
export function runReplay(level: LevelMap, replay: Replay): ReplayReport {
  const session = new GameplaySession({
    timing: { worldHz: replay.runtime.worldHz },
    bobbyLocomotion: replay.runtime.bobbyLocomotion,
    history: { mode: "disabled" },
  });
  session.loadLevel(level);
  validateReplay(session, replay);
  const initialIntents = resolveReplayInitialIntents(
    session,
    replay.initialIntents,
  );
  session.restart(initialIntents);

  const frames = new Map(replay.frames.map((frame) => [frame.tick, frame]));
  const events = new ReplayEventCounter();
  const ticks = session.advanceTicks(replay.endTick, (time) => ({
    groups: resolveReplayInputGroups(
      session,
      frames.get(time.tick)?.groups ?? [],
    ),
  }));
  for (const tick of ticks) events.record(tick.result.events);

  return {
    actual: events.finalState(session.state, session.winState),
    endTick: session.clock.tickCount,
  };
}
