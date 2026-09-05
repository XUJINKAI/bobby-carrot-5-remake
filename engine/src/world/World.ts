import type { Direction, LevelMap } from "@bobby/model";
import {
  behaviorRegistry as builtinBehaviors,
  createBuiltinRuntimeActionRegistry,
  entityRegistry as builtinEntities,
} from "../entities/registry.js";
import type { WorldTick } from "../time/WorldClock.js";
import {
  createGlobalState,
  type EconomyState,
  type GlobalState,
  type ProfileCapabilities,
} from "./GlobalState.js";
import {
  ActorLifecycleStore,
  type ActorLifecycleSnapshot,
  type ActorLifecycleState,
} from "./actor/ActorLifecycle.js";
import { WorldLifecycle } from "./actor/WorldLifecycle.js";
import type {
  RuntimeActionId,
  RuntimeActionSchedulerSnapshot,
  RuntimeActionSpec,
} from "./action/RuntimeAction.js";
import type { RuntimeActionRegistry } from "./action/RuntimeActionRegistry.js";
import { RuntimeActionScheduler } from "./action/RuntimeActionScheduler.js";
import { CommandQueue } from "./behavior/CommandQueue.js";
import { WorldDeltaSequence, type WorldDelta } from "./delta/WorldDelta.js";
import type {
  Behavior,
  BehaviorContext,
  MovementContext,
  PassageResult,
} from "./behavior/Behavior.js";
import type { BehaviorRegistry } from "./behavior/BehaviorRegistry.js";
import { WorldQueryApi } from "./behavior/WorldQueryApi.js";
import type { EntityDefinition } from "./entity/EntityDefinition.js";
import type { CellPosition, EntityId, EntityInstance } from "./entity/EntityInstance.js";
import type { EntityRegistry } from "./entity/EntityRegistry.js";
import { EntityStore, type EntityStoreSnapshot } from "./entity/EntityStore.js";
import { MovementTransaction } from "./movement/MovementTransaction.js";
import {
  createMovementPlan,
  type MovementPlan,
  type MovementPlanningContext,
} from "./movement/MovementPlan.js";
import {
  MovementRuntime,
  type MovementRuntimeSnapshot,
} from "./movement/MovementRuntime.js";
import type {
  MovementMarkerDefinition,
  WorldMotion,
} from "./movement/WorldMotion.js";
import { WorldOutcomeStore, type WorldOutcomeState } from "./outcome/WorldOutcome.js";
import { ReachResolver } from "./outcome/ReachResolver.js";
import type {
  MoveIntent,
  WorldIntent,
  WorldIntentGroup,
} from "./movement/WorldIntent.js";
import {
  emptyWorldStepResult,
  mergeWorldMutationSummary,
  mergeWorldStepResult,
  type EntityMotionRequest,
  type WorldMutationSummary,
  type WorldStepResult,
} from "./movement/WorldStepResult.js";
import type { EntityPresence } from "./spatial/EntityPresence.js";
import { SpatialIndex } from "./spatial/SpatialIndex.js";
import { WorldCommitter, type WorldCommitResult } from "./WorldCommitter.js";
import { WorldInspector } from "./WorldInspector.js";
import { WorldRuleEvaluator } from "./WorldRuleEvaluator.js";
import type {
  CellInspection,
  MoveResult,
  WinConditionState,
  WorldEvent,
} from "./WorldTypes.js";

export interface WorldSnapshot {
  entities: EntityStoreSnapshot;
  state: GlobalState;
  actions: RuntimeActionSchedulerSnapshot;
  movement: MovementRuntimeSnapshot;
  actors: ActorLifecycleSnapshot;
  outcome: WorldOutcomeState;
}

export interface WorldOptions {
  profile?: Partial<ProfileCapabilities>;
  economy?: Partial<EconomyState>;
  entities?: EntityRegistry;
  behaviors?: BehaviorRegistry;
  actions?: RuntimeActionRegistry;
  /** Game 注入正式 gameplay cadence；省略时 World.step 保持同步测试语义。 */
  motionDurationMs?: number;
}

export class World {
  readonly width: number;
  readonly height: number;
  readonly entities: EntityStore;
  readonly spatial: SpatialIndex;
  readonly query: WorldQueryApi;
  readonly registry: EntityRegistry;
  readonly behaviors: BehaviorRegistry;
  readonly actions: RuntimeActionScheduler;
  readonly movement = new MovementRuntime();
  readonly actors = new ActorLifecycleStore();
  readonly outcome = new WorldOutcomeStore();
  readonly rules: LevelMap["rules"];
  state: GlobalState;
  private readonly deltaSequence = new WorldDeltaSequence();
  private readonly committer: WorldCommitter;
  private readonly ruleEvaluator: WorldRuleEvaluator;
  private readonly reachResolver: ReachResolver;
  private readonly lifecycle: WorldLifecycle;
  private readonly inspector: WorldInspector;
  private motionDurationMs: number;
  private currentWorldTick: number | null = null;

  constructor(level: LevelMap, options: WorldOptions = {}) {
    this.width = level.width;
    this.height = level.height;
    this.rules = structuredClone(level.rules ?? {});
    this.registry = options.entities ?? builtinEntities;
    this.behaviors = options.behaviors ?? builtinBehaviors;
    this.actions = new RuntimeActionScheduler(
      options.actions ?? createBuiltinRuntimeActionRegistry(),
    );
    this.entities = new EntityStore(level.entities);
    this.spatial = new SpatialIndex(
      this.entities,
      this.registry,
      level.width,
      level.height,
    );
    this.state = createGlobalState(options.profile, options.economy);
    this.query = new WorldQueryApi(
      this.entities,
      this.spatial,
      this.registry,
      () => this.state,
      this.movement.motions,
    );
    this.inspector = new WorldInspector(this.entities, this.spatial);
    this.reachResolver = new ReachResolver(this.query, this.behaviors);
    this.committer = new WorldCommitter(
      this.entities,
      this.spatial,
      this.actions,
      this.query,
      this.movement,
      this.actors,
      this.outcome,
      () => this.state,
      this.deltaSequence,
    );
    this.ruleEvaluator = new WorldRuleEvaluator(
      this.rules,
      this.entities,
      this.spatial,
      this.query,
      this.reachResolver,
      () => this.state,
    );
    this.lifecycle = new WorldLifecycle(
      this.actors,
      this.outcome,
      this.movement,
      this.query,
      this.ruleEvaluator,
      () => this.state,
      this.deltaSequence,
      () => this.deltaClock(),
    );
    this.motionDurationMs = safeDuration(options.motionDurationMs ?? 0);
    this.lifecycle.initialize();
  }

  get dead(): boolean {
    return this.outcome.state.phase === "lost";
  }

  get completed(): boolean {
    return this.outcome.state.phase === "won";
  }

  get winState(): WinConditionState | null {
    return this.ruleEvaluator.winState;
  }

  get inputBlocked(): boolean {
    return this.actions.inputBlocked || this.movement.running.length > 0;
  }

  isInputBlockedFor(actorId: EntityId): boolean {
    return (
      !this.actors.isActive(actorId) ||
      this.movement.motions.forEntity(actorId)?.status === "running" ||
      this.actions.isInputBlockedFor(actorId)
    );
  }

  actorLifecycle(actorId: EntityId): Readonly<ActorLifecycleState> {
    return this.actors.state(actorId);
  }

  get cameraTarget(): EntityId | null {
    return this.actions.cameraTarget;
  }

  entity(id: EntityId): Readonly<EntityInstance> | undefined {
    return this.entities.get(id);
  }

  definition(id: EntityId): EntityDefinition {
    return this.registry.require(this.entities.require(id).type);
  }

  presencesAt(cell: CellPosition): readonly EntityPresence[] {
    return this.spatial.presencesAt(cell);
  }

  isActorClimbing(actorId: EntityId): boolean {
    const actor = this.entities.get(actorId);
    return actor ? this.spatial.hasTraitAt(actor.anchor, "climbable") : false;
  }

  setProfile(profile: Partial<ProfileCapabilities>): void {
    this.state.profile = { ...this.state.profile, ...profile };
  }

  setEconomy(economy: Partial<EconomyState>): void {
    this.state.economy = {
      bonusCoins: Math.max(
        0,
        Math.floor(economy.bonusCoins ?? this.state.economy.bonusCoins),
      ),
      goldenCarrots: Math.max(
        0,
        Math.floor(economy.goldenCarrots ?? this.state.economy.goldenCarrots),
      ),
    };
  }

  setMotionDurationMs(durationMs: number): void {
    this.motionDurationMs = safeDuration(durationMs);
  }

  startAction(spec: RuntimeActionSpec): RuntimeActionId {
    return this.actions.start(spec);
  }

  observeIntents(intents: readonly WorldIntent[]): void {
    this.actions.observeIntents(intents, this.query);
  }

  downActor(
    entityId: EntityId,
    reason = "An actor could not continue.",
  ): WorldStepResult {
    const queue = new CommandQueue();
    queue.downActor(entityId, reason);
    const result = emptyWorldStepResult();
    absorbCommit(result, this.committer.commit(queue, this.deltaClock()));
    this.lifecycle.settle(result, entityId);
    return result;
  }

  /** 只提供 engine 能力；复活位置、距离与消耗由具体机制另行决定。 */
  reviveActor(entityId: EntityId): WorldStepResult {
    if (!this.outcome.playing) return emptyWorldStepResult();
    const queue = new CommandQueue();
    queue.reviveActor(entityId);
    const result = emptyWorldStepResult();
    absorbCommit(result, this.committer.commit(queue, this.deltaClock()));
    this.lifecycle.syncLegacyState();
    return result;
  }

  eliminateActor(
    entityId: EntityId,
    reason = "An actor was eliminated.",
  ): WorldStepResult {
    const queue = new CommandQueue();
    queue.eliminateActor(entityId, reason);
    const result = emptyWorldStepResult();
    absorbCommit(result, this.committer.commit(queue, this.deltaClock()));
    this.lifecycle.settle(result, entityId);
    return result;
  }

  /** 兼容旧调用；新代码应消费 downActor 返回的完整 WorldStepResult。 */
  killActor(entityId: EntityId, reason?: string): WorldEvent[] {
    return this.downActor(entityId, reason).events;
  }

  clearTransientEffects(): void {
    this.state.fireTrail = [];
  }

  snapshot(): WorldSnapshot {
    return {
      entities: this.entities.snapshot(),
      state: structuredClone(this.state),
      actions: this.actions.snapshot(),
      movement: this.movement.snapshot(),
      actors: this.actors.snapshot(),
      outcome: this.outcome.state,
    };
  }

  restore(snapshot: WorldSnapshot): void {
    this.entities.restore(snapshot.entities);
    this.state = structuredClone(snapshot.state);
    this.actions.restore(snapshot.actions);
    this.movement.restore(snapshot.movement);
    this.actors.restore(snapshot.actors);
    this.outcome.restore(snapshot.outcome);
    this.lifecycle.syncLegacyState();
    this.spatial.rebuild();
  }

  inspect(x: number, y: number): CellInspection | null {
    return this.inspector.inspect({ x, y });
  }

  /**
   * World 的唯一 movement 入口。一个 group 可以同时包含多个 actor intent；
   * 所有成功 movement 与交互只在整组解析后统一 commit。
   */
  step(group: WorldIntentGroup): WorldStepResult {
    const transaction = new MovementTransaction();
    const moves: MoveResult[] = [];
    let playerInputMoved = false;

    for (const intent of group.intents) {
      if (intent.type !== "move") continue;
      const result = this.resolveMove(intent, transaction);
      moves.push(result);
      if (result.moved && intent.cause.type === "player-input")
        playerInputMoved = true;
    }

    if (playerInputMoved)
      transaction.commands.setGlobal("moves", this.state.moves + 1);
    if (transaction.motions.length > 0)
      transaction.commands.setGlobal("lastReachedSelectors", []);

    const commit = this.committer.commit(transaction.commands, this.deltaClock());
    const result: WorldStepResult = {
      moves,
      motions: [],
      events: commit.events,
      mutations: commit.mutations,
      deltas: commit.deltas,
    };
    this.startMotions(transaction.motions, result);
    this.lifecycle.settle(result);
    this.lifecycle.evaluateRules(result);

    return result;
  }

  /**
   * 一个 WorldTick 分成稳定 phase：
   * Movement markers -> RuntimeAction commands -> RuntimeAction intents -> Behavior onTick。
   * 每个 phase commit 后，后续 phase 才读取新的 World。
   */
  update(time: WorldTick): WorldStepResult {
    const result = emptyWorldStepResult();
    if (time.stepMs <= 0 || !this.outcome.playing)
      return result;

    this.currentWorldTick = time.tick;
    const actionsAtTickStart = this.actions.active.map((action) => action.id);
    this.state.elapsedMs += time.stepMs;
    this.advanceMotions(time.stepMs, result);
    if (!this.outcome.playing) {
      this.currentWorldTick = null;
      return result;
    }

    const actionsStartedByMovement = this.actions.active
      .map((action) => action.id)
      .filter((id) => !actionsAtTickStart.includes(id));
    const actionQueue = new CommandQueue();
    const actionRequests = this.actions.update(
      time,
      this.query,
      actionQueue,
      actionsAtTickStart,
    );
    const actionCommit = this.committer.commit(actionQueue, this.deltaClock());
    absorbCommit(result, actionCommit);
    this.lifecycle.settle(result);
    this.lifecycle.evaluateRules(result);
    if (!this.outcome.playing) {
      this.currentWorldTick = null;
      return result;
    }

    const handoffQueue = new CommandQueue();
    const handoffRequests = this.actions.update(
      { tick: time.tick, stepMs: 0 },
      this.query,
      handoffQueue,
      actionsStartedByMovement,
    );
    const handoffCommit = this.committer.commit(
      handoffQueue,
      this.deltaClock(),
    );
    absorbCommit(result, handoffCommit);
    this.lifecycle.settle(result);
    this.lifecycle.evaluateRules(result);
    if (!this.outcome.playing) {
      this.currentWorldTick = null;
      return result;
    }

    const readyActionRequests = [...actionRequests, ...handoffRequests];
    if (readyActionRequests.length > 0) {
      const actionStep = this.step({
        intents: readyActionRequests.map((request) => request.intent),
        historyBoundary: false,
      });
      mergeWorldStepResult(result, actionStep);
      const resultQueue = new CommandQueue();
      this.actions.resolveIntentResults(
        readyActionRequests,
        actionStep.moves,
        this.query,
        resultQueue,
      );
      const resultCommit = this.committer.commit(
        resultQueue,
        this.deltaClock(),
      );
      absorbCommit(result, resultCommit);
      this.lifecycle.settle(result);
      this.lifecycle.evaluateRules(result);
      if (!this.outcome.playing) {
        this.currentWorldTick = null;
        return result;
      }
    }

    const tickQueue = new CommandQueue();
    const snapshot = this.entities.all().map((entity) => entity.id);
    for (const entityId of snapshot) {
      const entity = this.entities.get(entityId);
      const presence = this.spatial.presencesForEntity(entityId)[0];
      if (!entity || !presence) continue;
      const context = this.context(
        entity,
        presence,
        entity,
        undefined,
        tickQueue,
        undefined,
        time,
      );
      for (const behavior of this.resolveBehaviors(entity, presence))
        behavior.onTick?.(context);
    }

    const tickCommit = this.committer.commit(tickQueue, this.deltaClock());
    absorbCommit(result, tickCommit);
    this.lifecycle.settle(result);
    this.lifecycle.evaluateRules(result);
    this.currentWorldTick = null;
    return result;
  }

  private resolveMove(
    intent: MoveIntent,
    group: MovementTransaction,
  ): MoveResult {
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
    if (!this.outcome.playing)
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        "world-finished",
      );
    if (!this.actors.isActive(actor.id))
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        "actor-inactive",
      );
    if (
      intent.cause.type === "player-input" &&
      this.actions.isInputBlockedFor(actor.id)
    )
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        "actor-busy",
      );
    if (this.movement.motions.forEntity(actor.id)?.status === "running")
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        "actor-busy",
      );
    if (!this.spatial.inBounds(to))
      return blockedResult(actor.id, from, to, intent.direction, "void");

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
      this.resolveMovementBehaviors(actor).map((behavior) =>
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
        from,
        to,
        intent.direction,
        leave.reason ?? "leave-blocked",
      );

    let pushed: {
      entityId: EntityId;
      from: CellPosition;
      to: CellPosition;
    } | null = null;
    const pushable = targetStack.find(
      (presence) =>
        presence.entityId !== actor.id &&
        presence.traits.includes("pushable"),
    );
    if (pushable) {
      const pushTo = addDirection(to, intent.direction);
      if (
        !this.canOccupy(pushTo, pushable.entityId, group) ||
        !group.canReserveDestination(pushable.entityId, pushTo)
      ) {
        this.runTouch(
          targetStack,
          actor,
          intent.direction,
          group.commands,
          movement,
        );
        return blockedResult(
          actor.id,
          from,
          to,
          intent.direction,
          "push-blocked",
        );
      }
      pushed = { entityId: pushable.entityId, from: to, to: pushTo };
    }

    if (!this.hasWalkable(to)) {
      this.runTouch(
        targetStack,
        actor,
        intent.direction,
        group.commands,
        movement,
      );
      return blockedResult(actor.id, from, to, intent.direction, "void");
    }

    const resolution = this.resolveEntry(
      targetStack,
      actor,
      intent.direction,
      local,
      movement,
      pushable?.entityId ?? null,
    );
    if (!resolution.passable) {
      this.runTouch(
        targetStack,
        actor,
        intent.direction,
        group.commands,
        movement,
      );
      return blockedResult(
        actor.id,
        from,
        to,
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
      pushable?.entityId ?? null,
    );
    if (!enter.passable) {
      this.runTouch(
        targetStack,
        actor,
        intent.direction,
        group.commands,
        movement,
      );
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        enter.reason ?? "blocked",
      );
    }

    if (pushed && !group.canReserveDestination(pushed.entityId, pushed.to))
      return blockedResult(
        actor.id,
        from,
        to,
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
    const primaryLifecycle = {
      ...plan.lifecycle,
      target: plan.lifecycle.target.filter(
        (presence) => presence.entityId !== pushable?.entityId,
      ),
    };
    local.move(
      actor.id,
      from,
      to,
      intent.direction,
      intent.cause,
      plan.updateDirection,
      primaryLifecycle,
    );
    this.appendCompanions(plan, local);
    group.reserveDestination(actor.id, to);
    for (const companion of plan.companions)
      group.reserveDestination(actor.id, companion.to);
    if (pushed) group.reserveDestination(pushed.entityId, pushed.to);
    group.absorb(local);

    return {
      actorId: actor.id,
      moved: true,
      from,
      to,
      direction: intent.direction,
      passage: { reason: "passable", confidence: "rule" },
      events: [],
    };
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
    group.reserveDestination(plan.actorId, plan.to);
    for (const companion of plan.companions)
      group.reserveDestination(plan.actorId, companion.to);
    group.absorb(local);
    return {
      actorId: plan.actorId,
      moved: true,
      from: plan.from,
      to: plan.to,
      direction: plan.direction,
      passage: { reason: plan.reason, confidence: "rule" },
      events: [],
    };
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
    ignoredEntity: EntityId | null = null,
  ): PassageResult {
    for (const presence of stack) {
      if (
        presence.entityId === actor.id ||
        presence.entityId === ignoredEntity
      )
        continue;
      const entity = this.entities.require(presence.entityId);
      for (const behavior of this.resolveBehaviors(entity, presence)) {
        const result = behavior.resolveEntry?.(
          this.context(
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
      for (const behavior of this.resolveBehaviors(entity, presence)) {
        const result = behavior[hook]?.(
          this.context(
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
        return {
          passable: false,
          reason: `blocking:${entity.type}`,
        };
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
      this.runHook(
        "onTouch",
        presence,
        actor,
        direction,
        queue,
        movement,
      );
    }
  }

  private runHook(
    hook: "onArrive" | "onEnter" | "onLeave" | "onTouch",
    presence: EntityPresence,
    actor: EntityInstance,
    direction: Direction,
    queue: CommandQueue,
    movement: MovementContext,
  ): void {
    const entity = this.entities.get(presence.entityId);
    if (!entity) return;
    const context = this.context(
      actor,
      presence,
      entity,
      direction,
      queue,
      movement,
    );
    for (const behavior of this.resolveBehaviors(entity, presence))
      behavior[hook]?.(context);
  }

  private resolveBehaviors(
    entity: EntityInstance,
    presence: EntityPresence,
  ): readonly Behavior[] {
    const definition = this.registry.require(entity.type);
    return this.behaviors.resolve(definition.behaviors, presence.traits);
  }

  private resolveMovementBehaviors(
    entity: EntityInstance,
  ): readonly Behavior[] {
    const definition = this.registry.require(entity.type);
    const traits = new Set(
      this.spatial
        .presencesForEntity(entity.id)
        .flatMap((presence) => [...presence.traits]),
    );
    return this.behaviors.resolve(definition.behaviors, [...traits]);
  }

  private context(
    actor: EntityInstance,
    presence: EntityPresence,
    self: EntityInstance,
    direction: Direction | undefined,
    queue: CommandQueue,
    movement?: MovementContext,
    time?: WorldTick,
  ): BehaviorContext {
    return {
      query: this.query,
      commands: queue,
      actor,
      self: { entity: self, presence },
      ...(direction ? { direction } : {}),
      ...(movement ? { movement } : {}),
      ...(time ? { time } : {}),
    };
  }

  private startMotions(
    requests: readonly EntityMotionRequest[],
    result: WorldStepResult,
  ): void {
    for (const request of requests) {
      const durationMs = this.durationForMotion(request);
      const motion = this.movement.start(
        request,
        durationMs,
        request.lifecycle,
      );
      result.motions.push(motion);
      result.deltas.push(
        this.deltaSequence.create(
          { type: "motion-started", motion },
          this.deltaClock(),
        ),
      );
    }
    this.advanceMotions(0, result);
  }

  private advanceMotions(stepMs: number, result: WorldStepResult): void {
    this.movement.advance(stepMs, {
      progressed: (motion) => {
        result.deltas.push(
          this.deltaSequence.create(
            { type: "motion-progressed", motion },
            this.deltaClock(),
          ),
        );
      },
      marker: (motion, marker) => {
        result.deltas.push(
          this.deltaSequence.create(
            { type: "motion-marker", motion, marker: marker.id },
            this.deltaClock(),
          ),
        );
        this.runMovementMarker(motion, marker, result);
      },
      completed: (motion) => {
        result.deltas.push(
          this.deltaSequence.create(
            { type: "motion-completed", motion },
            this.deltaClock(),
          ),
        );
        this.lifecycle.evaluateRules(result);
      },
    });
  }

  private runMovementMarker(
    motion: WorldMotion,
    marker: MovementMarkerDefinition,
    result: WorldStepResult,
  ): void {
    const plan = this.movement.plan(motion.id);
    const actor = this.entities.get(motion.entityId);
    if (!plan || !actor) return;
    const queue = new CommandQueue();
    const movement: MovementContext = {
      from: motion.from,
      to: motion.to,
      cause: motion.cause,
      motion: {
        id: motion.id,
        marker: marker.id,
        progress: motion.progress,
        durationMs: motion.durationMs,
      },
    };

    for (const dispatch of marker.dispatch ?? []) {
      const presences =
        dispatch.scope === "source" ? plan.source : plan.target;
      for (const presence of presences)
        this.runHook(
          dispatch.hook,
          presence,
          actor,
          motion.direction,
          queue,
          movement,
        );
    }
    if (marker.recordsReach === true) {
      const selectors = new Set(this.state.lastReachedSelectors);
      for (const selector of this.reachResolver.selectorsFor(
        actor,
        plan.target,
      ))
        selectors.add(selector);
      queue.setGlobal("lastReachedSelectors", [...selectors]);
    }

    const commit = this.committer.commit(queue, this.deltaClock());
    absorbCommit(result, commit);
    this.ruleEvaluator.refreshDerivedState();
    this.lifecycle.settle(result, motion.entityId);
  }

  private durationForMotion(request: EntityMotionRequest): number {
    if (
      request.cause.type === "forced" &&
      request.cause.cadenceMs !== undefined
    )
      return safeDuration(request.cause.cadenceMs);
    return this.motionDurationMs;
  }

  private deltaClock(): { worldTick: number | null; worldTimeMs: number } {
    return {
      worldTick: this.currentWorldTick,
      worldTimeMs: this.state.elapsedMs,
    };
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

function absorbCommit(target: WorldStepResult, commit: WorldCommitResult): void {
  target.events.push(...commit.events.map((event) => structuredClone(event)));
  target.deltas.push(...commit.deltas.map((delta) => structuredClone(delta)));
  mergeWorldMutationSummary(target.mutations, commit.mutations);
}

function pushUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value);
}

function safeDuration(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}
