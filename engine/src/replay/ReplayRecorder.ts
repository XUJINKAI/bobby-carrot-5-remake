import type { GameplaySession, GameplayTickResult } from "../core/GameplaySession.js";
import {
  REPLAY_FORMAT_VERSION,
  type Replay,
  type ReplayFrame,
  type ReplayGameplayIntent,
  type ReplayInitialIntent,
  type ReplayInputGroup,
  type ReplayRecordingMeta,
} from "./ReplayFormat.js";
import type { ActorEffectIntent } from "../world/movement/WorldIntent.js";

/** 只记录从关卡起点产生的玩家语义输入；World 自动行为由重放重新计算。 */
export class ReplayRecorder {
  private readonly frames: ReplayFrame[] = [];
  private stopped = false;

  constructor(
    private readonly session: GameplaySession,
    private readonly meta: ReplayRecordingMeta,
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
    const { initialIntents, ...runtime } = setup;
    return {
      formatVersion: REPLAY_FORMAT_VERSION,
      meta: {
        ...structuredClone(this.meta),
        final_status: this.session.state.status,
        note: "",
      },
      runtime,
      initialIntents: initialIntents.map(toReplayActorEffectIntent),
      endTick: this.session.clock.tickCount,
      frames: structuredClone(this.frames),
    };
  }
}

function toReplayInputGroup(group: GameplayTickResult["inputGroups"][number]): ReplayInputGroup {
  return {
    intents: group.intents.map(toReplayIntent),
  };
}

function toReplayIntent(
  intent: GameplayTickResult["inputGroups"][number]["intents"][number],
): ReplayGameplayIntent {
  if (intent.type !== "move") return toReplayActorEffectIntent(intent);
  return {
    type: "move",
    actorId: intent.actorId,
    direction: intent.direction,
    ...(intent.cause.type === "player-input" && intent.cause.source
      ? { source: intent.cause.source }
      : {}),
  };
}

function toReplayActorEffectIntent(
  intent: ActorEffectIntent,
): ReplayInitialIntent {
  if (intent.type === "grant-lock-key") {
    return {
      type: intent.type,
      actorId: intent.actorId,
      kind: intent.kind,
    };
  }
  return {
    type: intent.type,
    actorId: intent.actorId,
    moveDurationMs: intent.moveDurationMs,
  };
}
