import type { Direction, EntityType } from "@bobby/model";
import type { EntityId } from "../entity/EntityInstance.js";

export type MoveCause =
  | {
      type: "player-input";
      source?: string;
      /** Map controller channel；World 不解释该值。 */
      channel?: number;
      /** 应用 actor 镜像变换前的方向，供 Replay 保存控制语义。 */
      inputDirection?: Direction;
    }
  | {
      type: "forced";
      sourceEntityId?: EntityId;
      /** 提供给 Presentation 的 movement 语义标签。 */
      mechanism?: string;
      /** Gameplay cadence owned by that mechanism, in milliseconds. */
      cadenceMs?: number;
    }
  | { type: "push"; sourceEntityId: EntityId }
  | { type: "carry"; carrierId: EntityId }
  | { type: "actor" };

export interface MoveIntent {
  type: "move";
  actorId: EntityId;
  direction: Direction;
  cause: MoveCause;
}

/** 修改 actor 后续移动的实际时长；已经开始的 WorldMotion 保持原时长。 */
export interface SetActorLocomotionIntent {
  type: "set-actor-locomotion";
  actorId: EntityId;
  moveDurationMs: number;
}

/** 为 actor 增加关卡内消耗品；商品、价格和取得条件由宿主决定。 */
export interface AddActorInventoryItemIntent {
  type: "add-actor-inventory-item";
  actorId: EntityId;
  item: "lock-key";
  count: number;
  /** 外部交互用来在 Engine 接受动作后提交对应业务事务。 */
  requestId?: number;
}

export type ActorEffectIntent =
  | SetActorLocomotionIntent
  | AddActorInventoryItemIntent;

export interface EntityTargetReference {
  type: EntityType;
  x: number;
  y: number;
}

/** 把宿主持久化的产品结果提交到当前 World。 */
export interface CommitEntityReplacementIntent {
  type: "commit-entity-replacement";
  target: EntityTargetReference;
  replacementType: EntityType;
}

export type GameplayEffectIntent =
  | ActorEffectIntent
  | CommitEntityReplacementIntent;

export type WorldIntent = MoveIntent | GameplayEffectIntent;

export type InitialActorIntent =
  | {
      type: "set-actor-locomotion";
      actor: "primary" | "all";
      moveDurationMs: number;
    };

/** 一次玩家/系统语义操作可以同时向 World 提交多个 intent。 */
export interface WorldIntentGroup {
  /** Group 在提交前允许调用方组装；World.step 只在调用期间读取。 */
  intents: WorldIntent[];
  /** 同一 group 只算一个 user-visible history boundary。 */
  historyBoundary?: boolean;
  /** 由 Replay choice 可重建的宿主效果不重复写入录像。 */
  recordInReplay?: boolean;
}
