import type { LevelObject } from "@bobby/model";
import { ObjectId } from "../mechanics/ids.js";
import type { WorldEvent } from "../world/World.js";

type ObjectLookup = (x: number, y: number) => LevelObject | null;

/**
 * 地图内限时挑战状态机。
 *
 * 规则由 LevelObject.properties 携带，生命周期跟随当前 Game；它不理解
 * Adventure、章节或路由，只响应通用 WorldEvent。
 */
export class TimedChallenge {
  private remainingMsValue: number | null = null;

  get remainingMs(): number | null {
    return this.remainingMsValue;
  }

  snapshot(): number | null {
    return this.remainingMsValue;
  }

  restore(remainingMs: number | null): void {
    this.remainingMsValue = remainingMs;
  }

  reset(): void {
    this.remainingMsValue = null;
  }

  handleWorldEvent(event: WorldEvent, objectAt: ObjectLookup): void {
    if (
      event.type === "object-interaction" &&
      event.objectType === ObjectId.LOCK &&
      event.action === "open" &&
      event.x !== undefined &&
      event.y !== undefined
    ) {
      const duration = timedChallengeDuration(
        objectAt(event.x, event.y)?.properties?.timedChallengeMs,
      );
      if (duration !== null) this.remainingMsValue = duration;
      return;
    }

    if (
      event.type === "collect-golden-carrot" ||
      event.type === "death" ||
      event.type === "complete"
    )
      this.reset();
  }

  /** 返回 true 表示本次推进刚好触发超时。 */
  advance(deltaMs: number): boolean {
    if (
      this.remainingMsValue === null ||
      !Number.isFinite(deltaMs) ||
      deltaMs <= 0
    )
      return false;
    this.remainingMsValue = Math.max(0, this.remainingMsValue - deltaMs);
    if (this.remainingMsValue > 0) return false;
    this.reset();
    return true;
  }
}

export function timedChallengeDuration(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}
