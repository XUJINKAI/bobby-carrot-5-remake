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
  frameTicks: readonly number[];
  skipIdleTime: boolean;
  restoreWorldPaused: boolean;
  restorePresentationPaused: boolean;
}

export interface ReplayPlaybackOptions {
  /** 压缩稳定状态下超过一秒的无输入时间；World Tick 仍会逐个执行。 */
  skipIdleTime?: boolean;
}

const IDLE_SKIP_THRESHOLD_MS = 1000;
const IDLE_SKIP_TAIL_MS = 250;

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

  start(replay: Replay, options: ReplayPlaybackOptions = {}): void {
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
      frameTicks: replay.frames.map((frame) => frame.tick),
      skipIdleTime: options.skipIdleTime ?? false,
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

  /**
   * 快速执行当前长无输入区间，但保留下次输入前的短暂视觉间隔。
   * consumer 在每个 Tick 后决定是否仍适合继续，例如新运动已经开始时应立即停止。
   */
  advanceIdleTicks(
    maxTicks: number,
    consumer: (tick: GameplayTickResult) => boolean,
  ): number {
    const playback = this.active;
    const available = this.idleTicksAvailable(playback);
    const limit = Math.min(
      available,
      Math.max(0, Math.floor(Number.isFinite(maxTicks) ? maxTicks : 0)),
    );
    let count = 0;
    while (
      count < limit &&
      this.active === playback &&
      !this.session.clock.paused
    ) {
      const [tick] = this.session.advanceTicks(1, (time) =>
        this.inputForTick(time),
      );
      if (!tick) break;
      count += 1;
      if (!consumer(tick)) break;
    }
    return count;
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

  private idleTicksAvailable(playback: ActiveReplayPlayback | null): number {
    if (!playback?.skipIdleTime || this.session.clock.paused) return 0;
    const currentTick = this.session.clock.tickCount;
    const nextInputTick = firstTickAtOrAfter(
      playback.frameTicks,
      currentTick,
    );
    const boundary = nextInputTick ?? playback.replay.endTick;
    const idleTicks = Math.max(0, boundary - currentTick);
    if (idleTicks * this.session.clock.stepMs <= IDLE_SKIP_THRESHOLD_MS)
      return 0;
    const tailTicks = Math.ceil(
      IDLE_SKIP_TAIL_MS / this.session.clock.stepMs,
    );
    return Math.max(0, idleTicks - tailTicks);
  }
}

function firstTickAtOrAfter(
  ticks: readonly number[],
  target: number,
): number | null {
  let low = 0;
  let high = ticks.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if ((ticks[middle] ?? Number.POSITIVE_INFINITY) < target) low = middle + 1;
    else high = middle;
  }
  return ticks[low] ?? null;
}
