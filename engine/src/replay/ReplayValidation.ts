import type { Direction } from "@bobby/model";
import type { BobbyLocomotionTiming } from "../entities/player/BobbyLocomotion.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type { Replay } from "./ReplayFormat.js";
import type { ReplayGameplayIntent } from "./ReplayFormat.js";

/** 浏览器播放与无头 Runner 共用同一份 Replay 输入合同。 */
export function validateReplay(
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
  const replayLocomotion = replay.runtime?.bobbyLocomotion;
  if (
    !replayLocomotion ||
    replayLocomotion.moveMs !== bobbyLocomotion.moveMs
  )
    throw new Error("Replay 的 Bobby 运动参数与当前 Game 不兼容");
  if (!Array.isArray(replay.initialIntents))
    throw new Error("Replay initialIntents 必须是数组");
  if (!Array.isArray(replay.frames))
    throw new Error("Replay frames 必须是数组");

  const actors = new Set(actorIds);
  for (const intent of replay.initialIntents)
    validateIntent(intent, actors, false);
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
    if (!Array.isArray(frame.groups))
      throw new Error("Replay frame groups 必须是数组");
    for (const group of frame.groups) {
      if (!Array.isArray(group.intents))
        throw new Error("Replay input group intents 必须是数组");
      for (const intent of group.intents) {
        validateIntent(intent, actors, true);
      }
    }
  }
}

function validateIntent(
  intent: ReplayGameplayIntent,
  actors: ReadonlySet<EntityId>,
  allowMove: boolean,
): void {
  if (!intent || typeof intent !== "object" || !actors.has(intent.actorId))
    throw new Error("Replay 包含无效的 actor intent");
  if (intent.type === "move") {
    if (!allowMove || !isDirection(intent.direction))
      throw new Error("Replay 包含无效的玩家移动输入");
    return;
  }
  if (intent.type === "set-actor-locomotion") {
    if (
      !Number.isFinite(intent.moveDurationMs) ||
      intent.moveDurationMs <= 0
    )
      throw new Error("Replay 包含无效的 Bobby 移动时长");
    return;
  }
  if (
    intent.type !== "grant-lock-key" ||
    (intent.kind !== "single-use" && intent.kind !== "reusable")
  )
    throw new Error("Replay 包含无效的地图内语义动作");
}

function isDirection(value: unknown): value is Direction {
  return (
    value === "up" ||
    value === "down" ||
    value === "left" ||
    value === "right"
  );
}
