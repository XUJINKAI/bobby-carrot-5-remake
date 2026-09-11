import type { Direction } from "@bobby/model";
import type { GameplaySession } from "../core/GameplaySession.js";
import type { CellPosition } from "../world/entity/EntityInstance.js";
import type {
  Replay,
  ReplayCompletedCondition,
  ReplayGameplayIntent,
} from "./ReplayFormat.js";
import { isReplayPathId } from "./ReplayFormat.js";

/** 浏览器播放与无头 Runner 共用同一份 Replay 输入合同。 */
export function validateReplay(
  session: GameplaySession,
  replay: Replay,
): void {
  if (!replay || typeof replay !== "object")
    throw new Error("Replay 必须是对象");
  requireFields(replay, [
    "formatVersion",
    "meta",
    "runtime",
    "initialIntents",
    "finalState",
    "endTick",
    "frames",
  ]);
  if (replay.formatVersion !== 1)
    throw new Error(`不支持 Replay formatVersion ${replay.formatVersion}`);
  if (
    !isPlainObject(replay.meta) ||
    typeof replay.meta.id !== "string" ||
    typeof replay.meta.url !== "string" ||
    typeof replay.meta.note !== "string"
  )
    throw new Error("Replay meta 无效");
  requireFields(replay.meta, ["id", "url", "note"]);
  if (!isReplayPathId(replay.meta.id))
    throw new Error("Replay meta.id 必须使用 <collection>/<map-id> 路径身份");
  if (!isPlainObject(replay.runtime))
    throw new Error("Replay runtime 无效");
  requireFields(replay.runtime, ["worldHz", "bobbyLocomotion"]);
  if (!Number.isInteger(replay.endTick) || replay.endTick < 0)
    throw new Error("Replay endTick 必须是非负整数");
  if (!Number.isFinite(replay.runtime?.worldHz) || replay.runtime.worldHz <= 0)
    throw new Error("Replay worldHz 必须是正数");
  const replayLocomotion = replay.runtime?.bobbyLocomotion;
  if (
    !isPlainObject(replayLocomotion) ||
    replayLocomotion.moveMs !== session.bobbyLocomotion.moveMs
  )
    throw new Error("Replay 的 Bobby 运动参数与当前 Game 不兼容");
  requireFields(replayLocomotion, ["moveMs"]);
  if (!Array.isArray(replay.initialIntents))
    throw new Error("Replay initialIntents 必须是数组");
  if (!Array.isArray(replay.frames))
    throw new Error("Replay frames 必须是数组");

  for (const intent of replay.initialIntents)
    validateIntent(session, intent, false);
  let previousTick = -1;
  for (const frame of replay.frames) {
    if (!frame || typeof frame !== "object")
      throw new Error("Replay frame 必须是对象");
    requireFields(frame, ["tick", "groups", "choices"]);
    if (
      !Number.isInteger(frame.tick) ||
      frame.tick < 0 ||
      frame.tick >= replay.endTick ||
      frame.tick <= previousTick
    )
      throw new Error("Replay frame tick 必须严格递增且位于运行区间内");
    previousTick = frame.tick;
    if (!Array.isArray(frame.groups))
      throw new Error("Replay frame groups 必须是数组");
    if (
      frame.choices !== undefined &&
      (!Array.isArray(frame.choices) ||
        frame.choices.length === 0 ||
        frame.choices.some(
          (choice) => !Number.isInteger(choice) || choice < 1,
        ))
    ) {
      throw new Error("Replay frame choices 必须是非空正整数数组");
    }
    for (const group of frame.groups) {
      if (!group || typeof group !== "object")
        throw new Error("Replay input group 必须是对象");
      requireFields(group, ["intents"]);
      if (!Array.isArray(group.intents))
        throw new Error("Replay input group intents 必须是数组");
      for (const intent of group.intents)
        validateIntent(session, intent, true);
    }
  }
  validateFinalState(replay.finalState);
}

function validateIntent(
  session: GameplaySession,
  intent: ReplayGameplayIntent,
  allowMove: boolean,
): void {
  if (!intent || typeof intent !== "object")
    throw new Error("Replay 包含无效的 gameplay intent");
  if (intent.type === "move") {
    requireFields(intent, ["type", "direction", "channel", "actor"]);
    if (!allowMove || !isDirection(intent.direction))
      throw new Error("Replay 包含无效的玩家移动输入");
    if (intent.actor !== undefined && intent.channel !== undefined)
      throw new Error("Replay move 不能同时指定 channel 与 actor");
    if (intent.channel !== undefined) {
      if (!Number.isInteger(intent.channel) || intent.channel <= 0)
        throw new Error("Replay channel 必须是大于 0 的整数；channel 0 应省略");
      if (!session.controllerChannels.includes(intent.channel))
        throw new Error(`Replay controller channel ${intent.channel} 不存在`);
    } else if (
      intent.actor === undefined &&
      !session.controllerChannels.includes(0)
    ) {
      throw new Error("Replay controller channel 0 不存在");
    }
    if (intent.actor !== undefined)
      validateActorReference(session, intent.actor);
    return;
  }
  if (intent.type === "set-actor-locomotion") {
    requireFields(intent, ["type", "actor", "moveDurationMs"]);
    validateActorReference(session, intent.actor);
    if (!Number.isFinite(intent.moveDurationMs) || intent.moveDurationMs <= 0)
      throw new Error("Replay 包含无效的 Bobby 移动时长");
    return;
  }
  if (intent.type === "set-actor-lock-key") {
    requireFields(intent, ["type", "actor", "kind", "enabled"]);
    validateActorReference(session, intent.actor);
    if (
      (intent.kind !== "single-use" && intent.kind !== "reusable") ||
      typeof intent.enabled !== "boolean"
    )
      throw new Error("Replay 包含无效的 Lock 能力动作");
    return;
  }
  throw new Error("Replay 包含无效的地图内语义动作");
}

function validateActorReference(
  session: GameplaySession,
  actor: CellPosition | undefined,
): void {
  if (actor === undefined) {
    if (session.actorIds.length !== 1)
      throw new Error("多 Bobby 地图的 Replay actor 动作必须指定位置");
    return;
  }
  if (
    session.actorIds.length === 1 ||
    !Number.isInteger(actor.x) ||
    !Number.isInteger(actor.y)
  )
    throw new Error("Replay 包含无效的 actor 位置引用");
}

function validateFinalState(value: Replay["finalState"]): void {
  if (!isPlainObject(value))
    throw new Error("Replay finalState 必须是对象");
  requireFields(value, [
    "status",
    "moves",
    "elapsedMs",
    "counters",
    "completedConditions",
  ]);
  if (value.status !== undefined && !isFinalStatus(value.status))
    throw new Error("Replay finalState.status 无效");
  if (
    value.moves !== undefined &&
    (!Number.isInteger(value.moves) || value.moves < 0)
  )
    throw new Error("Replay finalState.moves 必须是非负整数");
  if (
    value.elapsedMs !== undefined &&
    (!Number.isInteger(value.elapsedMs) || value.elapsedMs < 0)
  )
    throw new Error("Replay finalState.elapsedMs 必须是非负整数");
  if (value.counters !== undefined) {
    if (!isPlainObject(value.counters))
      throw new Error("Replay finalState.counters 必须是对象");
    for (const [eventType, count] of Object.entries(value.counters)) {
      if (
        (!eventType.startsWith("collect-") && !eventType.startsWith("fill-")) ||
        !Number.isInteger(count) ||
        count <= 0
      )
        throw new Error("Replay finalState.counters 包含无效计数");
    }
  }
  if (value.completedConditions !== undefined) {
    if (!Array.isArray(value.completedConditions))
      throw new Error("Replay finalState.completedConditions 必须是数组");
    for (const condition of value.completedConditions)
      validateCompletedCondition(condition);
  }
}

function validateCompletedCondition(condition: ReplayCompletedCondition): void {
  if (!condition || typeof condition !== "object")
    throw new Error("Replay finalState 包含无效的通关条件");
  if (condition.type === "fill-all") {
    requireFields(condition, ["type", "target", "filler"]);
    if (
      !isNonEmptyString(condition.target) ||
      !isNonEmptyString(condition.filler)
    )
      throw new Error("Replay finalState 包含无效的 fill-all 条件");
    return;
  }
  if (condition.type === "collect-all" || condition.type === "reach") {
    requireFields(condition, ["type", "target"]);
    if (!isNonEmptyString(condition.target))
      throw new Error("Replay finalState 包含无效的终局条件");
    return;
  }
  throw new Error("Replay finalState 包含无效的通关条件");
}

function requireFields(value: object, allowed: readonly string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    throw new Error("Replay intent 或终局条件包含未声明字段");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isFinalStatus(value: unknown): boolean {
  return value === "playing" || value === "won" || value === "dead";
}

function isDirection(value: unknown): value is Direction {
  return (
    value === "up" ||
    value === "down" ||
    value === "left" ||
    value === "right"
  );
}
