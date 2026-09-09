import type {
  GameplaySession,
  GameplayTickInput,
  GameplayTickResult,
} from "../core/GameplaySession.js";
import type { PresentationClock } from "../time/PresentationClock.js";
import type { WorldTick } from "../time/WorldClock.js";
import {
  type Replay,
  type ReplayFrame,
} from "./ReplayFormat.js";
import { replayInputGroups } from "./ReplayRunner.js";
import { validateReplay } from "./ReplayValidation.js";

interface ActiveReplayPlayback {
  replay: Replay;
  frames: ReadonlyMap<number, ReplayFrame>;
  restoreWorldPaused: boolean;
  restorePresentationPaused: boolean;
}

/** 浏览器 Game 的 Replay 时间线驱动；World 执行仍全部委托给 GameplaySession。 */
export class ReplayPlayback {
  private active: ActiveReplayPlayback | null = null;

  constructor(
    private readonly session: GameplaySession,
    private readonly presentationClock: PresentationClock,
  ) {}

  get playing(): boolean {
    return this.active !== null;
  }

  get paused(): boolean {
    return this.active !== null && this.session.clock.paused;
  }

  get remainingTicks(): number {
    if (!this.active) return Number.POSITIVE_INFINITY;
    return Math.max(
      0,
      this.active.replay.endTick - this.session.clock.tickCount,
    );
  }

  start(replay: Replay): void {
    this.stop();
    validateReplay(
      this.session.actorIds,
      this.session.bobbyLocomotion,
      replay,
    );
    const restoreWorldPaused = this.session.clock.paused;
    const restorePresentationPaused = this.presentationClock.paused;
    this.resetToStart(replay);
    this.session.clock.resume();
    this.presentationClock.resume();
    this.active = {
      replay: structuredClone(replay),
      frames: new Map(
        replay.frames.map((frame) => [frame.tick, structuredClone(frame)]),
      ),
      restoreWorldPaused,
      restorePresentationPaused,
    };
    if (replay.endTick === 0) this.stop();
  }

  pause(): void {
    if (!this.active) return;
    this.session.clock.pause();
    this.presentationClock.pause();
  }

  resume(): void {
    if (!this.active) return;
    this.session.clock.resume();
    this.presentationClock.resume();
  }

  inputForTick(time: WorldTick): GameplayTickInput {
    if (!this.active) return {};
    return {
      groups: replayInputGroups(
        this.active.frames.get(time.tick)?.groups ?? [],
      ),
    };
  }

  finishIfComplete(): boolean {
    if (!this.active || this.remainingTicks > 0) return false;
    this.stop();
    return true;
  }

  jumpToEnd(replay: Replay): GameplayTickResult[] {
    this.stop();
    validateReplay(
      this.session.actorIds,
      this.session.bobbyLocomotion,
      replay,
    );
    this.resetToStart(replay);
    const frames = new Map(replay.frames.map((frame) => [frame.tick, frame]));
    return this.session.advanceTicks(replay.endTick, (time) => ({
      groups: replayInputGroups(frames.get(time.tick)?.groups ?? []),
    }));
  }

  stop(): void {
    const playback = this.active;
    if (!playback) return;
    this.active = null;
    if (playback.restoreWorldPaused) this.session.clock.pause();
    else this.session.clock.resume();
    if (playback.restorePresentationPaused) this.presentationClock.pause();
    else this.presentationClock.resume();
  }

  private resetToStart(replay: Replay): void {
    this.session.clock.setHz(replay.runtime.worldHz);
    this.session.restart();
  }
}
