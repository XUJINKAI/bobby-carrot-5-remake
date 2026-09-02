import type { Direction } from "@bobby/model";
import type { EntityId } from "../entity/EntityInstance.js";

export type MoveCause =
  | { type: "player-input"; source?: string }
  | { type: "forced"; sourceEntityId?: EntityId }
  | { type: "push"; sourceEntityId: EntityId }
  | { type: "carry"; carrierId: EntityId }
  | { type: "actor" }
  | { type: "projectile" };

export interface MoveIntent {
  type: "move";
  actorId: EntityId;
  direction: Direction;
  cause: MoveCause;
}

export type WorldIntent = MoveIntent;

/** 一次玩家/系统语义操作可以同时向 World 提交多个 intent。 */
export interface WorldIntentGroup {
  intents: readonly WorldIntent[];
  /** 同一 group 只算一个 user-visible history boundary。 */
  historyBoundary?: boolean;
}
