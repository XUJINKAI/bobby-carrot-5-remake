import type { LevelMap } from "@bobby/model";
import {
  behaviorRegistry as builtinBehaviors,
  createBuiltinRuntimeActionRegistry,
  entityRegistry as builtinEntities,
} from "../entities/registry.js";
import type { WorldTick } from "../time/WorldClock.js";
import {
  createGlobalState,
  type GlobalState,
} from "./GlobalState.js";
import {
  patchBobbyInventory,
  patchBobbyLocomotionMoveMs,
  readBobbyLocomotionMoveMs,
} from "../entities/player/BobbyState.js";
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
import { BehaviorRuntime } from "./behavior/BehaviorRuntime.js";
import { TickIndex } from "./behavior/TickIndex.js";
import { CommandQueue } from "./behavior/CommandQueue.js";
import { WorldDeltaSequence, type WorldDelta } from "./delta/WorldDelta.js";
import type {
  MovementContext,
} from "./behavior/Behavior.js";
import type { BehaviorRegistry } from "./behavior/BehaviorRegistry.js";
import { WorldQueryApi } from "./behavior/WorldQueryApi.js";
import type { EntityDefinition } from "./entity/EntityDefinition.js";
import type { CellPosition, EntityId, EntityInstance } from "./entity/EntityInstance.js";
import type { EntityRegistry } from "./entity/EntityRegistry.js";
import { EntityStore, type EntityStoreSnapshot } from "./entity/EntityStore.js";
import { MovementTransaction } from "./movement/MovementTransaction.js";
import {
  MovementRuntime,
  type MovementRuntimeSnapshot,
} from "./movement/MovementRuntime.js";
import { WorldMovementResolver } from "./movement/WorldMovementResolver.js";
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
  private readonly behaviorRuntime: BehaviorRuntime;
  private readonly tickIndex: TickIndex;
  private readonly movementResolver: WorldMovementResolver;
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
    this.state = createGlobalState();
    this.tickIndex = new TickIndex(this.registry, this.behaviors, this.spatial);
    this.query = new WorldQueryApi(
      this.entities,
      this.spatial,
      this.registry,
      () => this.state,
      this.movement.motions,
    );
    assertDistinctPlayerAnchors(this.query);
    this.inspector = new WorldInspector(this.entities, this.spatial);
    this.behaviorRuntime = new BehaviorRuntime(
      this.registry,
      this.behaviors,
      this.entities,
      this.spatial,
      this.query,
    );
    this.movementResolver = new WorldMovementResolver(
      this.entities,
      this.spatial,
      this.query,
      this.actions,
      this.movement,
      this.actors,
      this.outcome,
      this.behaviorRuntime,
    );
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
    this.settleTerminalRuntime(result);
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
    this.settleTerminalRuntime(result);
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
    const result = emptyWorldStepResult();
    this.applyActorIntents(group.intents, result);
    const transaction = new MovementTransaction();
    const moves: MoveResult[] = [];
    let playerInputMoved = false;
    const moveIntents = group.intents.filter(
      (intent): intent is MoveIntent => intent.type === "move",
    );
    this.movementResolver.reserveIntentDestinations(moveIntents, transaction);

    for (const intent of moveIntents) {
      const result = this.movementResolver.resolve(intent, transaction);
      moves.push(result);
      if (result.moved && intent.cause.type === "player-input")
        playerInputMoved = true;
    }

    if (playerInputMoved)
      transaction.commands.setGlobal("moves", this.state.moves + 1);
    if (transaction.motions.length > 0)
      transaction.commands.setGlobal("lastReachedSelectors", []);

    const commit = this.committer.commit(transaction.commands, this.deltaClock());
    result.moves.push(...moves);
    absorbCommit(result, commit);
    this.startMotions(transaction.motions, result);
    this.lifecycle.settle(result);
    this.lifecycle.evaluateRules(result);
    this.settleTerminalRuntime(result);

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
    const movementActionBudgets = this.advanceMotions(time.stepMs, result);
    this.settleTerminalRuntime(result);
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
    this.settleTerminalRuntime(result);
    if (!this.outcome.playing) {
      this.currentWorldTick = null;
      return result;
    }

    const handoffQueue = new CommandQueue();
    const handoffRequests = actionsStartedByMovement.flatMap((actionId) =>
      this.actions.update(
        {
          tick: time.tick,
          stepMs: movementActionBudgets.get(actionId) ?? 0,
        },
        this.query,
        handoffQueue,
        [actionId],
      )
    );
    const handoffCommit = this.committer.commit(
      handoffQueue,
      this.deltaClock(),
    );
    absorbCommit(result, handoffCommit);
    this.lifecycle.settle(result);
    this.lifecycle.evaluateRules(result);
    this.settleTerminalRuntime(result);
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
      this.settleTerminalRuntime(result);
      if (!this.outcome.playing) {
        this.currentWorldTick = null;
        return result;
      }
    }

    const tickQueue = new CommandQueue();
    const snapshot = this.tickIndex.entityIds();
    for (const entityId of snapshot) {
      const entity = this.entities.get(entityId);
      const presence = this.spatial.presencesForEntity(entityId)[0];
      if (!entity || !presence) continue;
      const context = this.behaviorRuntime.context(
        entity,
        presence,
        entity,
        undefined,
        tickQueue,
        undefined,
        time,
      );
      for (const behavior of this.behaviorRuntime.resolve(entity, presence))
        behavior.onTick?.(context);
    }

    const tickCommit = this.committer.commit(tickQueue, this.deltaClock());
    absorbCommit(result, tickCommit);
    this.lifecycle.settle(result);
    this.lifecycle.evaluateRules(result);
    this.settleTerminalRuntime(result);
    this.currentWorldTick = null;
    return result;
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

  /**
   * 推进 motion，并记录 marker 新建 Action 在当前 tick 还可消费的真实时间。
   * marker 前已用于 motion 的时间不能再次交给 Action，否则大 tick 会重复计时；
   * 剩余时间也不能直接丢弃，否则连续机关会在每格之间产生一个空 tick。
   */
  private advanceMotions(
    stepMs: number,
    result: WorldStepResult,
  ): ReadonlyMap<RuntimeActionId, number> {
    const initialElapsed = new Map(
      this.movement.running.map((motion) => [motion.id, motion.elapsedMs]),
    );
    const actionBudgets = new Map<RuntimeActionId, number>();
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
        const actionsBeforeMarker = new Set(
          this.actions.active.map((action) => action.id),
        );
        result.deltas.push(
          this.deltaSequence.create(
            { type: "motion-marker", motion, marker: marker.id },
            this.deltaClock(),
          ),
        );
        this.runMovementMarker(motion, marker, result);
        const consumedMs = Math.max(
          0,
          motion.elapsedMs - (initialElapsed.get(motion.id) ?? 0),
        );
        const remainingMs = Math.max(0, stepMs - consumedMs);
        for (const action of this.actions.active) {
          if (!actionsBeforeMarker.has(action.id))
            actionBudgets.set(action.id, remainingMs);
        }
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
    return actionBudgets;
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
        this.behaviorRuntime.runHook(
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

  /** Terminal World 不再推进 gameplay；所有仍在运行的过程必须在同一结算点结束。 */
  private settleTerminalRuntime(result: WorldStepResult): void {
    if (this.outcome.playing) return;

    const cancellationQueue = new CommandQueue();
    for (const action of this.actions.active)
      cancellationQueue.cancelAction(action.id, "world-finished");
    absorbCommit(
      result,
      this.committer.commit(cancellationQueue, this.deltaClock()),
    );

    for (const motion of this.movement.running) {
      const interrupted = this.movement.interruptEntity(
        motion.entityId,
        "world-finished",
        motion.progress,
      );
      if (!interrupted) continue;
      result.deltas.push(
        this.deltaSequence.create(
          { type: "motion-interrupted", motion: interrupted },
          this.deltaClock(),
        ),
      );
    }
  }

  private durationForMotion(request: EntityMotionRequest): number {
    if (
      request.cause.type === "forced" &&
      request.cause.cadenceMs !== undefined
    )
      return safeDuration(request.cause.cadenceMs);
    return readBobbyLocomotionMoveMs(
      this.entities.get(request.entityId)?.state,
    ) ?? this.motionDurationMs;
  }

  private applyActorIntents(
    intents: readonly WorldIntent[],
    result: WorldStepResult,
  ): void {
    const states = new Map<EntityId, EntityInstance["state"]>();
    const queue = new CommandQueue();
    for (const intent of intents) {
      if (intent.type === "move") continue;
      const actor = this.entities.get(intent.actorId);
      if (!actor || !this.query.entityHasTrait(actor.id, "player")) continue;
      const state = states.get(actor.id) ?? structuredClone(actor.state);
      if (intent.type === "set-actor-locomotion") {
        if (!Number.isFinite(intent.moveDurationMs) || intent.moveDurationMs <= 0)
          continue;
        states.set(
          actor.id,
          patchBobbyLocomotionMoveMs(state, intent.moveDurationMs),
        );
        queue.emit({
          type: "actor-locomotion-changed",
          entityId: actor.id,
          data: { moveDurationMs: intent.moveDurationMs },
        });
        continue;
      }
      states.set(
        actor.id,
        patchBobbyInventory(
          state,
          intent.kind === "reusable"
            ? { reusableLockKey: intent.enabled }
            : { singleUseLockKey: intent.enabled },
        ),
      );
      queue.emit({
        type: "actor-lock-key-changed",
        entityId: actor.id,
        ...(intent.requestId !== undefined
          ? { requestId: intent.requestId }
          : {}),
        data: { kind: intent.kind, enabled: intent.enabled },
      });
    }
    for (const [entityId, state] of states) {
      if (state) queue.setState(entityId, state);
    }
    absorbCommit(result, this.committer.commit(queue, this.deltaClock()));
  }

  private deltaClock(): { worldTick: number | null; worldTimeMs: number } {
    return {
      worldTick: this.currentWorldTick,
      worldTimeMs: this.state.elapsedMs,
    };
  }

}

function assertDistinctPlayerAnchors(query: WorldQueryApi): void {
  const occupied = new Map<string, EntityId>();
  for (const player of query.entitiesWithTrait("player")) {
    const key = `${player.anchor.x},${player.anchor.y}`;
    const existing = occupied.get(key);
    if (existing !== undefined) {
      throw new Error(
        `Player Entity #${existing} 与 #${player.id} 不能占据同一格 ${key}。`,
      );
    }
    occupied.set(key, player.id);
  }
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
