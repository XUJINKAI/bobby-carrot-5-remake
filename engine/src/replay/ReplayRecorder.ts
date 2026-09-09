import type { GameplaySession, GameplayTickResult } from "../core/GameplaySession.js";
import {
  REPLAY_FORMAT_VERSION,
  replayLevelHash,
  replayValueHash,
  type Replay,
  type ReplayFrame,
  type ReplayInputGroup,
  type ReplayMoveIntent,
} from "./ReplayFormat.js";

/** 只记录从关卡起点产生的玩家语义输入；World 自动行为由重放重新计算。 */
export class ReplayRecorder {
  private readonly frames: ReplayFrame[] = [];
  private stopped = false;

  constructor(
    private readonly session: GameplaySession,
    private readonly level: Parameters<typeof replayLevelHash>[0],
  ) {
    if (session.clock.tickCount !== 0)
      throw new Error("Replay 录制必须从 tick 0 开始");
    if (!session.replaySetup)
      throw new Error("当前 Session 的初始状态不能序列化为 Replay");
  }

  record(result: GameplayTickResult): void {
    if (this.stopped || result.inputGroups.length === 0) return;
    this.frames.push({
      tick: result.time.tick,
      groups: result.inputGroups.map(toReplayInputGroup),
    });
  }

  stop(): Replay {
    if (this.stopped) throw new Error("Replay 录制已经结束");
    this.stopped = true;
    const setup = this.session.replaySetup;
    if (!setup) throw new Error("当前 Session 的初始状态不能序列化为 Replay");
    return {
      formatVersion: REPLAY_FORMAT_VERSION,
      levelHash: replayLevelHash(this.level),
      runtime: setup,
      frames: structuredClone(this.frames),
      endTick: this.session.clock.tickCount,
      expectation: {
        status: this.session.state.status,
        moves: this.session.state.moves,
        stateHash: replayValueHash(this.session.world.snapshot()),
      },
    };
  }
}

function toReplayInputGroup(group: GameplayTickResult["inputGroups"][number]): ReplayInputGroup {
  return {
    intents: group.intents.map((intent): ReplayMoveIntent => ({
      type: "move",
      actorId: intent.actorId,
      direction: intent.direction,
      ...(intent.cause.type === "player-input" && intent.cause.source
        ? { source: intent.cause.source }
        : {}),
    })),
  };
}
