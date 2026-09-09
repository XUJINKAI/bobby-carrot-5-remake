import type { Direction } from "@bobby/model";
import type { BobbyLocomotionTiming } from "../entities/player/BobbyLocomotion.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type { Replay } from "./ReplayFormat.js";

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
    replayLocomotion.moveMs !== bobbyLocomotion.moveMs ||
    replayLocomotion.speedShoesScale !== bobbyLocomotion.speedShoesScale
  )
    throw new Error("Replay 的 Bobby 运动参数与当前 Game 不兼容");
  if (!Array.isArray(replay.frames))
    throw new Error("Replay frames 必须是数组");

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
    if (!Array.isArray(frame.groups))
      throw new Error("Replay frame groups 必须是数组");
    for (const group of frame.groups) {
      if (!Array.isArray(group.intents))
        throw new Error("Replay input group intents 必须是数组");
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
