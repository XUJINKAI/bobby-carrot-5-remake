import type { Direction } from "@bobby/model";
import type { RuntimeActionScheduler } from "../action/RuntimeActionScheduler.js";
import type { ActorLifecycleStore } from "../actor/ActorLifecycle.js";
import type { BehaviorRuntime } from "../behavior/BehaviorRuntime.js";
import type { CommandQueue } from "../behavior/CommandQueue.js";
import type {
  MovementContext,
  PassageResult,
} from "../behavior/Behavior.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "../entity/EntityInstance.js";
import type { EntityStore } from "../entity/EntityStore.js";
import type { MovementRuntime } from "./MovementRuntime.js";
import type { WorldOutcomeStore } from "../outcome/WorldOutcome.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { SpatialIndex } from "../spatial/SpatialIndex.js";
import type { MoveResult } from "../WorldTypes.js";
import {
  createMovementPlan,
  type MovementPlan,
  type MovementPlanningContext,
} from "./MovementPlan.js";
import { MovementTransaction } from "./MovementTransaction.js";
import type { MoveIntent } from "./WorldIntent.js";

/** 一次 semantic move 的通用 planning、passage 与原子提交裁决。 */
export class WorldMovementResolver {
  constructor(
    private readonly entities: EntityStore,
    private readonly spatial: SpatialIndex,
    private readonly query: WorldQueryApi,
    private readonly actions: RuntimeActionScheduler,
    private readonly movement: MovementRuntime,
    private readonly actors: ActorLifecycleStore,
    private readonly outcome: WorldOutcomeStore,
    private readonly behaviorRuntime: BehaviorRuntime,
  ) {}

  resolve(intent: MoveIntent, group: MovementTransaction): MoveResult {
    const actor = this.entities.get(intent.actorId);
    const missingFrom = actor?.anchor ?? { x: -1, y: -1 };
    if (!actor)
      return blockedResult(
        intent.actorId,
        missingFrom,
        missingFrom,
        intent.direction,
        "missing-actor",
      );

    const from = { ...actor.anchor };
    const to = addDirection(from, intent.direction);
    const movement: MovementContext = { from, to, cause: intent.cause };
    const unavailable = this.unavailableReason(actor, intent, to);
    if (unavailable)
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        unavailable,
      );

    const sourceStack = [...this.spatial.presencesAt(from)].reverse();
    const targetStack = [...this.spatial.presencesAt(to)].reverse();
    const planningContext: MovementPlanningContext = {
      actor,
      query: this.query,
      direction: intent.direction,
      from,
      to,
      cause: intent.cause,
      source: sourceStack,
      target: targetStack,
    };
    const plan = createMovementPlan(
      planningContext,
      this.behaviorRuntime.resolveForMovement(actor).map((behavior) =>
        behavior.planMovement?.(planningContext),
      ),
    );
    const planBlocked = this.validatePlan(plan, group);
    if (planBlocked)
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        planBlocked,
      );
    if (plan.passage === "unrestricted")
      return this.commitMovementPlan(plan, group);

    return this.resolveStandardPassage(
      actor,
      intent,
      plan,
      sourceStack,
      targetStack,
      movement,
      group,
    );
  }

  private unavailableReason(
    actor: EntityInstance,
    intent: MoveIntent,
    to: CellPosition,
  ): string | null {
    if (!this.outcome.playing) return "world-finished";
    if (!this.actors.isActive(actor.id)) return "actor-inactive";
    if (
      intent.cause.type === "player-input" &&
      this.actions.isInputBlockedFor(actor.id)
    )
      return "actor-busy";
    if (this.movement.motions.forEntity(actor.id)?.status === "running")
      return "actor-busy";
    return this.spatial.inBounds(to) ? null : "void";
  }

  private resolveStandardPassage(
    actor: EntityInstance,
    intent: MoveIntent,
    plan: MovementPlan,
    sourceStack: readonly EntityPresence[],
    targetStack: readonly EntityPresence[],
    movement: MovementContext,
    group: MovementTransaction,
  ): MoveResult {
    const local = new MovementTransaction();
    const leave = this.runPassage(
      sourceStack,
      actor,
      intent.direction,
      local,
      "canLeave",
      movement,
    );
    if (!leave.passable)
      return blockedResult(
        actor.id,
        plan.from,
        plan.to,
        intent.direction,
        leave.reason ?? "leave-blocked",
      );

    const pushable = targetStack.find(
      (presence) =>
        presence.entityId !== actor.id &&
        presence.traits.includes("pushable"),
    );
    const pushed = pushable
      ? {
          entityId: pushable.entityId,
          from: plan.to,
          to: addDirection(plan.to, intent.direction),
        }
      : null;
    if (
      pushed &&
      (!this.canOccupy(pushed.to, pushed.entityId, group) ||
        !group.canReserveDestination(pushed.entityId, pushed.to))
    ) {
      this.runTouch(targetStack, actor, intent.direction, group.commands, movement);
      return blockedResult(
        actor.id,
        plan.from,
        plan.to,
        intent.direction,
        "push-blocked",
      );
    }

    if (!this.hasWalkable(plan.to)) {
      this.runTouch(targetStack, actor, intent.direction, group.commands, movement);
      return blockedResult(
        actor.id,
        plan.from,
        plan.to,
        intent.direction,
        "void",
      );
    }

    const ignoredEntity = pushable?.entityId ?? null;
    const resolution = this.resolveEntry(
      targetStack,
      actor,
      intent.direction,
      local,
      movement,
      ignoredEntity,
    );
    if (!resolution.passable) {
      this.runTouch(targetStack, actor, intent.direction, group.commands, movement);
      return blockedResult(
        actor.id,
        plan.from,
        plan.to,
        intent.direction,
        resolution.reason ?? "blocked",
      );
    }

    const enter = this.runPassage(
      targetStack,
      actor,
      intent.direction,
      local,
      "canEnter",
      movement,
      ignoredEntity,
    );
    if (!enter.passable) {
      this.runTouch(targetStack, actor, intent.direction, group.commands, movement);
      return blockedResult(
        actor.id,
        plan.from,
        plan.to,
        intent.direction,
        enter.reason ?? "blocked",
      );
    }
    if (pushed && !group.canReserveDestination(pushed.entityId, pushed.to))
      return blockedResult(
        actor.id,
        plan.from,
        plan.to,
        intent.direction,
        "destination-conflict",
      );

    if (pushed)
      local.move(
        pushed.entityId,
        pushed.from,
        pushed.to,
        intent.direction,
        { type: "push", sourceEntityId: actor.id },
        false,
      );
    local.move(
      actor.id,
      plan.from,
      plan.to,
      intent.direction,
      intent.cause,
      plan.updateDirection,
      {
        ...plan.lifecycle,
        target: plan.lifecycle.target.filter(
          (presence) => presence.entityId !== ignoredEntity,
        ),
      },
    );
    this.appendCompanions(plan, local);
    this.reservePlan(plan, group);
    if (pushed) group.reserveDestination(pushed.entityId, pushed.to);
    group.absorb(local);

    return movedResult(plan, "passable");
  }

  private validatePlan(
    plan: MovementPlan,
    group: MovementTransaction,
  ): string | null {
    if (!group.canReserveDestination(plan.actorId, plan.to))
      return "destination-conflict";
    for (const companion of plan.companions) {
      const entity = this.entities.get(companion.entityId);
      if (!entity) return "missing-companion";
      if (!this.actors.isActive(entity.id)) return "companion-inactive";
      if (!this.spatial.inBounds(companion.to)) return "companion-out-of-bounds";
      if (this.movement.motions.forEntity(entity.id)?.status === "running")
        return "companion-busy";
      if (!group.canReserveDestination(plan.actorId, companion.to))
        return "destination-conflict";
    }
    return null;
  }

  private commitMovementPlan(
    plan: MovementPlan,
    group: MovementTransaction,
  ): MoveResult {
    const local = new MovementTransaction();
    local.move(
      plan.actorId,
      plan.from,
      plan.to,
      plan.direction,
      plan.cause,
      plan.updateDirection,
      plan.lifecycle,
    );
    this.appendCompanions(plan, local);
    this.reservePlan(plan, group);
    group.absorb(local);
    return movedResult(plan, plan.reason);
  }

  private appendCompanions(
    plan: MovementPlan,
    transaction: MovementTransaction,
  ): void {
    for (const companion of plan.companions) {
      const entity = this.entities.require(companion.entityId);
      transaction.move(
        entity.id,
        entity.anchor,
        companion.to,
        plan.direction,
        companion.cause,
        companion.updateDirection ?? false,
        companion.lifecycle,
      );
    }
  }

  private reservePlan(
    plan: MovementPlan,
    transaction: MovementTransaction,
  ): void {
    transaction.reserveDestination(plan.actorId, plan.to);
    for (const companion of plan.companions)
      transaction.reserveDestination(plan.actorId, companion.to);
  }

  private canOccupy(
    cell: CellPosition,
    movingEntityId: EntityId,
    transaction?: MovementTransaction,
  ): boolean {
    if (!this.spatial.inBounds(cell) || !this.hasWalkable(cell)) return false;
    return !this.spatial.presencesAt(cell).some(
      (presence) =>
        presence.entityId !== movingEntityId &&
        !transaction?.isEntryAllowed(presence.entityId) &&
        (presence.traits.includes("blocking") ||
          presence.traits.includes("pushable")),
    );
  }

  private hasWalkable(cell: CellPosition): boolean {
    return this.spatial.hasTraitAt(cell, "walkable");
  }

  private resolveEntry(
    stack: readonly EntityPresence[],
    actor: EntityInstance,
    direction: Direction,
    transaction: MovementTransaction,
    movement: MovementContext,
    ignoredEntity: EntityId | null,
  ): PassageResult {
    for (const presence of stack) {
      if (
        presence.entityId === actor.id ||
        presence.entityId === ignoredEntity
      )
        continue;
      const entity = this.entities.require(presence.entityId);
      for (const behavior of this.behaviorRuntime.resolve(entity, presence)) {
        const result = behavior.resolveEntry?.(
          this.behaviorRuntime.context(
            actor,
            presence,
            entity,
            direction,
            transaction.commands,
            movement,
          ),
        );
        if (!result) continue;
        if (result.result === "blocked")
          return {
            passable: false,
            ...(result.reason ? { reason: result.reason } : {}),
          };
        if (result.result === "pass" || result.result === "clear-and-pass")
          transaction.allowEntryFor(presence.entityId);
      }
    }
    return { passable: true };
  }

  private runPassage(
    stack: readonly EntityPresence[],
    actor: EntityInstance,
    direction: Direction,
    transaction: MovementTransaction,
    hook: "canEnter" | "canLeave",
    movement: MovementContext,
    ignoredEntity: EntityId | null = null,
  ): PassageResult {
    for (const presence of stack) {
      if (
        presence.entityId === actor.id ||
        presence.entityId === ignoredEntity ||
        (hook === "canEnter" && transaction.isEntryAllowed(presence.entityId))
      )
        continue;
      const entity = this.entities.require(presence.entityId);
      let explicitPass = false;
      for (const behavior of this.behaviorRuntime.resolve(entity, presence)) {
        const result = behavior[hook]?.(
          this.behaviorRuntime.context(
            actor,
            presence,
            entity,
            direction,
            transaction.commands,
            movement,
          ),
        );
        if (result?.passable === false) return result;
        if (result?.passable === true) explicitPass = true;
      }
      if (!explicitPass && presence.traits.includes("blocking"))
        return { passable: false, reason: `blocking:${entity.type}` };
    }
    return { passable: true };
  }

  private runTouch(
    stack: readonly EntityPresence[],
    actor: EntityInstance,
    direction: Direction,
    queue: CommandQueue,
    movement: MovementContext,
  ): void {
    for (const presence of stack) {
      if (presence.entityId === actor.id) continue;
      this.behaviorRuntime.runHook(
        "onTouch",
        presence,
        actor,
        direction,
        queue,
        movement,
      );
    }
  }
}

function addDirection(
  cell: CellPosition,
  direction: Direction,
): CellPosition {
  if (direction === "up") return { x: cell.x, y: cell.y - 1 };
  if (direction === "down") return { x: cell.x, y: cell.y + 1 };
  if (direction === "left") return { x: cell.x - 1, y: cell.y };
  return { x: cell.x + 1, y: cell.y };
}

function blockedResult(
  actorId: EntityId,
  from: CellPosition,
  to: CellPosition,
  direction: Direction,
  reason: string,
): MoveResult {
  return {
    actorId,
    moved: false,
    blocked: true,
    from,
    to,
    direction,
    passage: { reason, confidence: "rule" },
    events: [],
  };
}

function movedResult(plan: MovementPlan, reason: string): MoveResult {
  return {
    actorId: plan.actorId,
    moved: true,
    from: plan.from,
    to: plan.to,
    direction: plan.direction,
    passage: { reason, confidence: "rule" },
    events: [],
  };
}
