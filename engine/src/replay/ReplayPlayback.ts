import type { Direction } from "@bobby/model";
import type {
  GameplaySession,
  GameplayTickInput,
  GameplayTickResult,
} from "../core/GameplaySession.js";
import type { BobbyLocomotionTiming } from "../entities/player/BobbyLocomotion.js";
import type { PresentationClock } from "../time/PresentationClock.js";
import type { WorldTick } from "../time/WorldClock.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import {
  type Replay,
  type ReplayFrame,
} from "./ReplayFormat.js";
import { replayInputGroups } from "./ReplayRunner.js";

interface ActiveReplayPlayback {
  replay: Replay;
  frames: ReadonlyMap<number, ReplayFrame>;
  restoreWorldSpeed: number;
  restorePresentationSpeed: number;
  restoreWorldPaused: boolean;
  restorePresentationPaused: boolean;
}

/** 浏览器 Game 的 Replay 时间线驱动；World 执行仍全部委托给 GameplaySession。 */
export class ReplayPlayback {
  private active: ActiveReplayPlayback | null = null;
  private speedValue = 1;

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

  get speed(): number {
    return this.speedValue;
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
    validateReplayForPlayback(
      this.session.actorIds,
      this.session.bobbyLocomotion,
      replay,
    );
    const restoreWorldSpeed = this.session.clock.speed;
    const restorePresentationSpeed = this.presentationClock.speed;
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
      restoreWorldSpeed,
      restorePresentationSpeed,
      restoreWorldPaused,
      restorePresentationPaused,
    };
    this.applySpeed();
    if (replay.endTick === 0) this.stop();
  }

  setSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0) return;
    this.speedValue = speed;
    if (this.active) this.applySpeed();
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
    validateReplayForPlayback(
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
    this.session.clock.setSpeed(playback.restoreWorldSpeed);
    this.presentationClock.setSpeed(playback.restorePresentationSpeed);
    if (playback.restoreWorldPaused) this.session.clock.pause();
    else this.session.clock.resume();
    if (playback.restorePresentationPaused) this.presentationClock.pause();
    else this.presentationClock.resume();
  }

  private resetToStart(replay: Replay): void {
    this.session.clock.setHz(replay.runtime.worldHz);
    this.session.restart();
  }

  private applySpeed(): void {
    this.session.clock.setSpeed(this.speedValue);
    this.presentationClock.setSpeed(this.speedValue);
  }
}

function validateReplayForPlayback(
  actorIds: readonly EntityId[],
  bobbyLocomotion: BobbyLocomotionTiming,
  replay: Replay,
): void {
  if (replay.formatVersion !== 1)
    throw new Error(`不支持 Replay formatVersion ${replay.formatVersion}`);
  if (!Number.isInteger(replay.endTick) || replay.endTick < 0)
    throw new Error("Replay endTick 必须是非负整数");
  if (!Number.isFinite(replay.runtime?.worldHz) || replay.runtime.worldHz <= 0)
    throw new Error("Replay worldHz 必须是正数");
  if (
    JSON.stringify(replay.runtime.bobbyLocomotion) !==
    JSON.stringify(bobbyLocomotion)
  )
    throw new Error("Replay 的 Bobby 运动参数与当前 Game 不兼容");

  const actors = new Set(actorIds);
  let previousTick = -1;
  for (const frame of replay.frames) {
    if (
      !Number.isInteger(frame.tick) ||
      frame.tick < 0 ||
      frame.tick >= replay.endTick ||
      frame.tick <= previousTick
    )
      throw new Error("Replay frame tick 必须严格递增且位于运行区间内");
    previousTick = frame.tick;
    for (const group of frame.groups) {
      for (const intent of group.intents) {
        if (
          intent.type !== "move" ||
          !actors.has(intent.actorId) ||
          !isDirection(intent.direction)
        )
          throw new Error("Replay 包含无效的玩家移动输入");
      }
    }
  }
}

function isDirection(value: unknown): value is Direction {
  return (
    value === "up" ||
    value === "down" ||
    value === "left" ||
    value === "right"
  );
}
