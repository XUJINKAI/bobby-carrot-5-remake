import type { Direction } from "@bobby/model";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../entity/EntityInstance.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { MoveCause } from "./WorldIntent.js";
import type { MovementLifecycle } from "./WorldMotion.js";

export type MovementPassage = "standard" | "unrestricted";

/** 随主 movement 原子提交的空间参与者；同一 plan 的参与者允许共享目的格。 */
export interface MovementCompanion {
  entityId: EntityId;
  to: CellPosition;
  cause: MoveCause;
  updateDirection?: boolean;
  lifecycle?: MovementLifecycle;
}

/**
 * Entity Behavior 提出的移动规则。它只描述裁决差异，不推进时间，也不修改 World。
 * 多个 Behavior 的 policy 会在 World 执行前收口为一个 MovementPlan。
 */
export interface MovementPolicy {
  passage?: MovementPassage;
  updateDirection?: boolean;
  lifecycle?: MovementLifecycle;
  companions?: readonly MovementCompanion[];
  reason?: string;
}

export interface MovementPlanningContext {
  readonly actor: Readonly<EntityInstance>;
  readonly query: WorldQueryApi;
  readonly direction: Direction;
  readonly from: CellPosition;
  readonly to: CellPosition;
  readonly cause: MoveCause;
  readonly source: readonly EntityPresence[];
  readonly target: readonly EntityPresence[];
}

/** World 用于裁决和原子提交的规范化 movement 事实。 */
export interface MovementPlan {
  actorId: EntityId;
  from: CellPosition;
  to: CellPosition;
  direction: Direction;
  cause: MoveCause;
  passage: MovementPassage;
  updateDirection: boolean;
  lifecycle: MovementLifecycle;
  companions: readonly MovementCompanion[];
  reason: string;
}

export function createMovementPlan(
  context: MovementPlanningContext,
  policies: readonly (MovementPolicy | void)[],
): MovementPlan {
  let passage: MovementPassage = "standard";
  let updateDirection = true;
  let lifecycle: MovementLifecycle = {
    source: clonePresences(context.source),
    target: clonePresences(context.target),
  };
  let reason = "passable";
  let passageOwner: number | null = null;
  let directionOwner: number | null = null;
  let lifecycleOwner: number | null = null;
  const companions = new Map<EntityId, MovementCompanion>();

  policies.forEach((policy, index) => {
    if (!policy) return;
    if (policy.passage !== undefined) {
      assertCompatible("passage", passageOwner, passage, policy.passage);
      passage = policy.passage;
      passageOwner = index;
    }
    if (policy.updateDirection !== undefined) {
      assertCompatible(
        "updateDirection",
        directionOwner,
        updateDirection,
        policy.updateDirection,
      );
      updateDirection = policy.updateDirection;
      directionOwner = index;
    }
    if (policy.lifecycle !== undefined) {
      if (lifecycleOwner !== null)
        throw new Error("多个 MovementPolicy 同时定义 lifecycle");
      lifecycle = cloneLifecycle(policy.lifecycle);
      lifecycleOwner = index;
    }
    if (policy.reason !== undefined) reason = policy.reason;
    for (const companion of policy.companions ?? []) {
      const normalized = cloneCompanion(companion);
      const current = companions.get(normalized.entityId);
      if (current && !sameCompanion(current, normalized))
        throw new Error(
          `Movement companion ${normalized.entityId} 存在冲突定义`,
        );
      companions.set(normalized.entityId, normalized);
    }
  });

  if (companions.has(context.actor.id))
    throw new Error("Movement companion 不能重复 primary actor");

  return {
    actorId: context.actor.id,
    from: { ...context.from },
    to: { ...context.to },
    direction: context.direction,
    cause: structuredClone(context.cause),
    passage,
    updateDirection,
    lifecycle,
    companions: [...companions.values()],
    reason,
  };
}

function assertCompatible<T>(
  field: string,
  owner: number | null,
  current: T,
  next: T,
): void {
  if (owner !== null && current !== next)
    throw new Error(`MovementPolicy 的 ${field} 存在冲突定义`);
}

function cloneCompanion(companion: MovementCompanion): MovementCompanion {
  return {
    entityId: companion.entityId,
    to: { ...companion.to },
    cause: structuredClone(companion.cause),
    ...(companion.updateDirection !== undefined
      ? { updateDirection: companion.updateDirection }
      : {}),
    ...(companion.lifecycle
      ? { lifecycle: cloneLifecycle(companion.lifecycle) }
      : {}),
  };
}

function cloneLifecycle(lifecycle: MovementLifecycle): MovementLifecycle {
  return {
    source: clonePresences(lifecycle.source),
    target: clonePresences(lifecycle.target),
    ...(lifecycle.markers
      ? { markers: lifecycle.markers.map((marker) => structuredClone(marker)) }
      : {}),
  };
}

function clonePresences(
  presences: readonly EntityPresence[],
): EntityPresence[] {
  return presences.map((presence) => structuredClone(presence));
}

function sameCompanion(
  left: MovementCompanion,
  right: MovementCompanion,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
