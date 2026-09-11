import type { GameplaySession, GameplayTickResult } from "../core/GameplaySession.js";
import {
  REPLAY_FORMAT_VERSION,
  isReplayPathId,
  type Replay,
  type ReplayFrame,
  type ReplayGameplayIntent,
  type ReplayInitialIntent,
  type ReplayInputGroup,
  type ReplayRecordingMeta,
} from "./ReplayFormat.js";
import type { ActorEffectIntent } from "../world/movement/WorldIntent.js";
import type { CellPosition, EntityId } from "../world/entity/EntityInstance.js";
import { ReplayEventCounter } from "./ReplayFinalState.js";

/** 只记录从关卡起点产生的玩家语义输入；World 自动行为由重放重新计算。 */
export class ReplayRecorder {
  private readonly frames: ReplayFrame[] = [];
  private readonly events = new ReplayEventCounter();
  private readonly initialActorReferences = new Map<EntityId, CellPosition>();
  private readonly actorReferences = new Map<EntityId, CellPosition>();
  private stopped = false;

  constructor(
    private readonly session: GameplaySession,
    private readonly meta: ReplayRecordingMeta,
  ) {
    if (!isReplayPathId(meta.id))
      throw new Error("Replay meta.id 必须使用 <collection>/<map-id> 路径身份");
    if (session.clock.tickCount !== 0)
      throw new Error("Replay 录制必须从 tick 0 开始");
    if (!session.replaySetup)
      throw new Error("当前 Session 的初始状态不能序列化为 Replay");
    for (const actorId of session.actorIds) {
      const actor = session.world.entity(actorId);
      if (!actor) continue;
      this.initialActorReferences.set(actorId, { ...actor.anchor });
      this.actorReferences.set(actorId, { ...actor.anchor });
    }
  }

  record(result: GameplayTickResult): void {
    if (this.stopped) return;
    this.events.record(result.result.events);
    if (result.inputGroups.length > 0) {
      this.frames.push({
        tick: result.time.tick,
        groups: result.inputGroups.map((group) =>
          toReplayInputGroup(
            this.session.actorIds,
            this.actorReferences,
            group,
          )),
      });
    }
    this.updateActorReferences();
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
        note: "",
      },
      runtime,
      initialIntents: initialIntents.map((intent) =>
        toReplayActorEffectIntent(
          intent,
          replayActorReference(
            this.session.actorIds,
            this.initialActorReferences.get(intent.actorId),
          ),
        )),
      finalState: this.events.finalState(
        this.session.state,
        this.session.world.state.elapsedMs,
        this.session.winState,
      ),
      endTick: this.session.clock.tickCount,
      frames: structuredClone(this.frames),
    };
  }

  private updateActorReferences(): void {
    this.actorReferences.clear();
    for (const actorId of this.session.actorIds) {
      const actor = this.session.world.entity(actorId);
      if (actor) this.actorReferences.set(actorId, { ...actor.anchor });
    }
  }
}

function toReplayInputGroup(
  actorIds: readonly EntityId[],
  actorReferences: ReadonlyMap<EntityId, CellPosition>,
  group: GameplayTickResult["inputGroups"][number],
): ReplayInputGroup {
  const intents: ReplayGameplayIntent[] = [];
  const recordedMoves = new Set<string>();
  for (const intent of group.intents) {
    if (intent.type === "commit-entity-replacement") {
      intents.push({
        type: intent.type,
        target: structuredClone(intent.target),
        replacementType: intent.replacementType,
      });
      continue;
    }
    if (intent.type !== "move") {
      intents.push(
        toReplayActorEffectIntent(
          intent,
          replayActorReference(
            actorIds,
            actorReferences.get(intent.actorId),
          ),
        ),
      );
      continue;
    }
    const channel = intent.cause.type === "player-input"
      ? intent.cause.channel
      : undefined;
    const direction = intent.cause.type === "player-input"
      ? intent.cause.inputDirection ?? intent.direction
      : intent.direction;
    const actor = channel === undefined
      ? replayActorReference(actorIds, actorReferences.get(intent.actorId))
      : undefined;
    const key = channel === undefined
      ? `actor:${intent.actorId}:${direction}`
      : `channel:${channel}:${direction}`;
    if (recordedMoves.has(key)) continue;
    recordedMoves.add(key);
    intents.push({
      type: "move",
      direction,
      ...(channel !== undefined && channel !== 0 ? { channel } : {}),
      ...(actor ? { actor } : {}),
    });
  }
  return {
    intents,
  };
}

function toReplayActorEffectIntent(
  intent: ActorEffectIntent,
  actor: CellPosition | undefined,
): ReplayInitialIntent {
  if (intent.type === "set-actor-lock-key") {
    return {
      type: intent.type,
      ...(actor ? { actor } : {}),
      kind: intent.kind,
      enabled: intent.enabled,
    };
  }
  return {
    type: intent.type,
    ...(actor ? { actor } : {}),
    moveDurationMs: intent.moveDurationMs,
  };
}

function replayActorReference(
  actorIds: readonly EntityId[],
  position: Readonly<CellPosition> | undefined,
): CellPosition | undefined {
  if (actorIds.length === 1) return undefined;
  if (!position) throw new Error("Replay 动作引用了不存在的 Bobby");
  return { ...position };
}
