import type { Direction, LevelLimit, LevelMap, WinCondition } from "@bobby/model";
import {
  behaviorRegistry as builtinBehaviors,
  entityRegistry as builtinEntities,
} from "../entities/registry.js";
import type { WorldTick } from "../time/WorldClock.js";
import {
  createGlobalState,
  type EconomyState,
  type GlobalState,
  type ProfileCapabilities,
} from "./GlobalState.js";
import type {
  RuntimeActionId,
  RuntimeActionSchedulerSnapshot,
  RuntimeActionSpec,
} from "./action/RuntimeAction.js";
import type { RuntimeActionRegistry } from "./action/RuntimeActionRegistry.js";
import { RuntimeActionScheduler } from "./action/RuntimeActionScheduler.js";
import { createBuiltinRuntimeActionRegistry } from "./action/builtinActions.js";
import { CommandQueue } from "./behavior/CommandQueue.js";
import type {
  Behavior,
  BehaviorContext,
  MovementContext,
  PassageResult,
} from "./behavior/Behavior.js";
import type { BehaviorRegistry } from "./behavior/BehaviorRegistry.js";
import { WorldQueryApi } from "./behavior/WorldQueryApi.js";
import type { EntityDefinition } from "./entity/EntityDefinition.js";
import type {
  CellPosition,
  EntityId,
  EntityInstance,
} from "./entity/EntityInstance.js";
import type { EntityRegistry } from "./entity/EntityRegistry.js";
import {
  EntityStore,
  type EntityStoreSnapshot,
} from "./entity/EntityStore.js";
import { MovementTransaction } from "./movement/MovementTransaction.js";
import type { MoveIntent, WorldIntentGroup } from "./movement/WorldIntent.js";
import {
  emptyMutationSummary,
  type WorldMutationSummary,
  type WorldStepResult,
} from "./movement/WorldStepResult.js";
import type { EntityPresence } from "./spatial/EntityPresence.js";
import { SpatialIndex } from "./spatial/SpatialIndex.js";
import type {
  CellInspection,
  MoveResult,
  PresenceInspection,
  WinConditionState,
  WorldEvent,
} from "./WorldTypes.js";

export interface WorldSnapshot {
  entities: EntityStoreSnapshot;
  state: GlobalState;
  actions: RuntimeActionSchedulerSnapshot;
}

export interface WorldOptions {
  profile?: Partial<ProfileCapabilities>;
  economy?: Partial<EconomyState>;
  entities?: EntityRegistry;
  behaviors?: BehaviorRegistry;
  actions?: RuntimeActionRegistry;
}

interface CommitResult {
  events: WorldEvent[];
  mutations: WorldMutationSummary;
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
  readonly rules: LevelMap["rules"];
  state: GlobalState;

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
    );
    this.refreshDerivedState();
    this.evaluateCompletion([]);
  }

  get dead(): boolean {
    return this.state.dead;
  }

  get completed(): boolean {
    return this.state.completed;
  }

  get winState(): WinConditionState | null {
    return this.rules?.win ? this.evaluateWin(this.rules.win) : null;
  }

  get inputBlocked(): boolean {
    return this.actions.inputBlocked;
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
      bonusCoins: Math.max(0, Math.floor(economy.bonusCoins ?? this.state.economy.bonusCoins)),
      goldenCarrots: Math.max(0, Math.floor(economy.goldenCarrots ?? this.state.economy.goldenCarrots)),
    };
  }

  startAction(spec: RuntimeActionSpec): RuntimeActionId {
    return this.actions.start(spec);
  }

  killActor(entityId: EntityId, reason = "An actor could not continue."): WorldEvent[] {
    if (this.state.dead) return [];
    this.state.dead = true;
    this.state.deathReason = reason;
    return [{ type: "death", entityId, reason }];
  }

  clearTransientEffects(): void {
    this.state.fireTrail = [];
  }

  snapshot(): WorldSnapshot {
    return {
      entities: this.entities.snapshot(),
      state: structuredClone(this.state),
      actions: this.actions.snapshot(),
    };
  }

  restore(snapshot: WorldSnapshot): void {
    this.entities.restore(snapshot.entities);
    this.state = structuredClone(snapshot.state);
    this.actions.restore(snapshot.actions);
    this.spatial.rebuild();
  }

  inspect(x: number, y: number): CellInspection | null {
    const cell = { x, y };
    if (!this.spatial.inBounds(cell)) return null;
    const rawPresences = this.spatial.presencesAt(cell);
    const presences = rawPresences.map((presence) => this.inspectPresence(presence));
    const topPresence = presences.at(-1);
    const actorIds = [
      ...new Set(
        rawPresences
          .filter((presence) => presence.traits.includes("player"))
          .map((presence) => presence.entityId),
      ),
    ];
    return {
      cell,
      presences,
      ...(topPresence ? { topPresence } : {}),
      actorIds,
    };
  }

  /**
   * World 的唯一 movement 入口。一个 group 可以同时包含多个 actor intent；
   * 所有成功 movement 与交互只在整组解析后统一 commit。
   */
  step(group: WorldIntentGroup): WorldStepResult {
    const transaction = new MovementTransaction();
    const moves: MoveResult[] = [];
    const reachedSelectors = new Set<string>();
    let playerInputMoved = false;

    for (const intent of group.intents) {
      if (intent.type !== "move") continue;
      const result = this.resolveMove(intent, transaction, reachedSelectors);
      moves.push(result);
      if (result.moved && intent.cause.type === "player-input") playerInputMoved = true;
    }

    if (playerInputMoved)
      transaction.commands.setGlobal("moves", this.state.moves + 1);
    if (reachedSelectors.size > 0)
      transaction.commands.setGlobal("lastReachedSelectors", [...reachedSelectors]);

    const beforeDead = this.state.dead;
    const beforeCompleted = this.state.completed;
    const commit = this.commit(transaction.commands);
    this.refreshDerivedState();
    this.evaluateCompletion(commit.events);
    this.evaluateLimits(commit.events);
    if (!beforeDead && this.state.dead)
      pushUnique(commit.mutations.globalsChanged, "dead");
    if (!beforeCompleted && this.state.completed)
      pushUnique(commit.mutations.globalsChanged, "completed");

    return {
      moves,
      motions: transaction.motions.map((motion) => structuredClone(motion)),
      events: commit.events,
      mutations: commit.mutations,
    };
  }

  /** RuntimeAction 与 Behavior 都只在统一 WorldTick 上推进。 */
  update(time: WorldTick): WorldEvent[] {
    if (time.stepMs <= 0 || this.state.dead || this.state.completed) return [];
    this.state.elapsedMs += time.stepMs;
    const queue = new CommandQueue();

    this.actions.update(time, this.query, queue);

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
        queue,
        undefined,
        time,
      );
      for (const behavior of this.resolveBehaviors(entity, presence))
        behavior.onTick?.(context);
    }
    const commit = this.commit(queue);
    this.refreshDerivedState();
    this.evaluateCompletion(commit.events);
    this.evaluateLimits(commit.events);
    return commit.events;
  }

  private resolveMove(
    intent: MoveIntent,
    group: MovementTransaction,
    reachedSelectors: Set<string>,
  ): MoveResult {
    const actor = this.entities.get(intent.actorId);
    const missingFrom = actor?.anchor ?? { x: -1, y: -1 };
    if (!actor)
      return blockedResult(intent.actorId, missingFrom, missingFrom, intent.direction, "missing-actor");

    const from = { ...actor.anchor };
    const to = addDirection(from, intent.direction);
    const movement: MovementContext = { from, to, cause: intent.cause };
    if (this.state.dead || this.state.completed)
      return blockedResult(actor.id, from, to, intent.direction, "world-finished");
    if (!this.spatial.inBounds(to))
      return blockedResult(actor.id, from, to, intent.direction, "void");

    const local = new MovementTransaction();
    const sourceStack = [...this.spatial.presencesAt(from)].reverse();
    const targetStack = [...this.spatial.presencesAt(to)].reverse();
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

    let pushed: { entityId: EntityId; from: CellPosition; to: CellPosition } | null = null;
    const pushable = targetStack.find(
      (presence) =>
        presence.entityId !== actor.id && presence.traits.includes("pushable"),
    );
    if (pushable) {
      const pushTo = addDirection(to, intent.direction);
      if (
        !this.canOccupy(pushTo, pushable.entityId, group) ||
        !group.canReserveDestination(pushable.entityId, pushTo)
      ) {
        this.runTouch(targetStack, actor, intent.direction, group.commands, movement);
        return blockedResult(actor.id, from, to, intent.direction, "push-blocked", group);
      }
      pushed = { entityId: pushable.entityId, from: to, to: pushTo };
    }

    if (!this.hasWalkable(to)) {
      this.runTouch(targetStack, actor, intent.direction, group.commands, movement);
      return blockedResult(actor.id, from, to, intent.direction, "void", group);
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
      this.runTouch(targetStack, actor, intent.direction, group.commands, movement);
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        resolution.reason ?? "blocked",
        group,
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
      this.runTouch(targetStack, actor, intent.direction, group.commands, movement);
      return blockedResult(
        actor.id,
        from,
        to,
        intent.direction,
        enter.reason ?? "blocked",
        group,
      );
    }

    if (!group.canReserveDestination(actor.id, to))
      return blockedResult(actor.id, from, to, intent.direction, "destination-conflict");
    if (pushed && !group.canReserveDestination(pushed.entityId, pushed.to))
      return blockedResult(actor.id, from, to, intent.direction, "destination-conflict");

    for (const presence of sourceStack)
      this.runHook("onLeave", presence, actor, intent.direction, local.commands, movement);
    if (pushed)
      local.move(pushed.entityId, pushed.from, pushed.to, intent.direction, false);
    local.move(actor.id, from, to, intent.direction);
    for (const presence of targetStack) {
      if (
        presence.entityId !== pushable?.entityId &&
        !local.isEntryAllowed(presence.entityId)
      )
        this.runHook("onEnter", presence, actor, intent.direction, local.commands, movement);
      else if (local.isEntryAllowed(presence.entityId) && this.entities.get(presence.entityId))
        this.runHook("onEnter", presence, actor, intent.direction, local.commands, movement);
    }

    for (const selector of this.selectorsForPresences(targetStack))
      reachedSelectors.add(selector);
    group.reserveDestination(actor.id, to);
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
      if (presence.entityId === actor.id || presence.entityId === ignoredEntity) continue;
      const entity = this.entities.require(presence.entityId);
      for (const behavior of this.resolveBehaviors(entity, presence)) {
        const result = behavior.resolveEntry?.(
          this.context(actor, presence, entity, direction, transaction.commands, movement),
        );
        if (!result) continue;
        if (result.result === "blocked")
          return { passable: false, ...(result.reason ? { reason: result.reason } : {}) };
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
          this.context(actor, presence, entity, direction, transaction.commands, movement),
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
      this.runHook("onTouch", presence, actor, direction, queue, movement);
    }
  }

  private runHook(
    hook: "onEnter" | "onLeave" | "onTouch",
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

  private commit(queue: CommandQueue): CommitResult {
    const events: WorldEvent[] = [];
    const mutations = emptyMutationSummary();
    for (const command of queue.drain()) {
      switch (command.type) {
        case "spawn": {
          const entity = this.entities.spawn(command.entity);
          this.spatial.addEntity(entity);
          pushUnique(mutations.spawned, entity.id);
          break;
        }
        case "destroy":
          this.actions.cancelOwnedBy(command.entityId);
          this.spatial.removeEntity(command.entityId);
          this.entities.destroy(command.entityId);
          pushUnique(mutations.destroyed, command.entityId);
          break;
        case "move":
          if (this.entities.get(command.entityId)) {
            this.spatial.moveEntity(command.entityId, {
              x: command.x,
              y: command.y,
            });
            pushUnique(mutations.moved, command.entityId);
          }
          break;
        case "set-direction": {
          const entity = this.entities.get(command.entityId);
          if (entity) {
            entity.direction = command.direction;
            this.spatial.rebuildEntity(entity.id);
          }
          break;
        }
        case "set-state": {
          const entity = this.entities.get(command.entityId);
          if (entity) {
            entity.state = structuredClone(command.state);
            pushUnique(mutations.stateChanged, command.entityId);
          }
          break;
        }
        case "set-global":
          (this.state as unknown as Record<string, unknown>)[command.key] =
            structuredClone(command.value);
          pushUnique(mutations.globalsChanged, command.key);
          break;
        case "start-action": {
          const id = this.actions.start(command.action);
          pushUnique(mutations.actionsStarted, id);
          break;
        }
        case "cancel-action":
          this.actions.cancel(command.actionId);
          pushUnique(mutations.actionsCancelled, command.actionId);
          break;
        case "emit":
          events.push(command.event);
          break;
      }
    }
    return { events, mutations };
  }

  private refreshDerivedState(): void {
    this.state.goldenCarrotsInLevel =
      this.query.entitiesWithTrait("golden-carrot").length;
    this.state.bonusCoinsInLevel =
      this.query.entitiesWithTrait("bonus-coin").length;
  }

  private evaluateCompletion(events: WorldEvent[]): void {
    if (this.state.completed || this.state.dead) return;
    const win = this.winState;
    if (!win?.completed) return;
    this.state.completed = true;
    events.push({ type: "complete" });
  }

  private evaluateLimits(events: WorldEvent[]): void {
    if (this.state.completed || this.state.dead) return;
    for (const limit of this.rules?.limits ?? []) {
      const exceeded = this.limitExceeded(limit);
      if (!exceeded) continue;
      const reason = limit.type === "max-moves"
        ? `Move limit exceeded: ${limit.moves}`
        : `Time limit exceeded: ${limit.seconds}s`;
      if (!this.state.dead) {
        this.state.dead = true;
        this.state.deathReason = reason;
        events.push({ type: "death", reason });
      }
      return;
    }
  }

  private limitExceeded(limit: LevelLimit): boolean {
    if (limit.type === "max-moves") return this.state.moves > limit.moves;
    return this.state.elapsedMs > limit.seconds * 1000;
  }

  private evaluateWin(condition: WinCondition): WinConditionState {
    switch (condition.type) {
      case "all": {
        const conditions = condition.conditions.map((item) =>
          this.evaluateWin(item),
        );
        return {
          type: "all",
          completed: conditions.every((item) => item.completed),
          conditions,
        };
      }
      case "any": {
        const conditions = condition.conditions.map((item) =>
          this.evaluateWin(item),
        );
        return {
          type: "any",
          completed: conditions.some((item) => item.completed),
          conditions,
        };
      }
      case "collect-all": {
        const remaining = this.matchingEntityCount(condition.target);
        return {
          type: "collect-all",
          target: condition.target,
          completed: remaining === 0,
          remaining,
        };
      }
      case "reach": {
        const actors = this.query.entitiesWithTrait("player");
        return {
          type: "reach",
          target: condition.target,
          completed:
            actors.some((actor) => this.hasSelectorAt(actor.anchor, condition.target)) ||
            this.state.lastReachedSelectors.includes(condition.target),
        };
      }
      case "fill-all": {
        const targets = this.spatialCellsMatching(condition.target);
        const remaining = targets.filter(
          (cell) => !this.hasSelectorAt(cell, condition.filler),
        ).length;
        return {
          type: "fill-all",
          target: condition.target,
          filler: condition.filler,
          completed: targets.length > 0 && remaining === 0,
          remaining,
        };
      }
    }
  }

  private matchingEntityCount(selector: string): number {
    return this.entities
      .all()
      .filter(
        (entity) =>
          entity.type === selector ||
          this.query.entityHasTrait(entity.id, selector),
      ).length;
  }

  private hasSelectorAt(cell: CellPosition, selector: string): boolean {
    return this.spatial.presencesAt(cell).some((presence) => {
      const entity = this.entities.require(presence.entityId);
      return entity.type === selector || presence.traits.includes(selector);
    });
  }

  private selectorsForPresences(presences: readonly EntityPresence[]): string[] {
    const selectors = new Set<string>();
    for (const presence of presences) {
      const entity = this.entities.get(presence.entityId);
      if (!entity) continue;
      selectors.add(entity.type);
      for (const trait of presence.traits) selectors.add(trait);
    }
    return [...selectors];
  }

  private spatialCellsMatching(selector: string): CellPosition[] {
    const result = new Map<string, CellPosition>();
    for (const entity of this.entities.all()) {
      const typeMatches = entity.type === selector;
      for (const presence of this.spatial.presencesForEntity(entity.id)) {
        if (!typeMatches && !presence.traits.includes(selector)) continue;
        result.set(`${presence.cell.x},${presence.cell.y}`, presence.cell);
      }
    }
    return [...result.values()];
  }

  private inspectPresence(
    presence: EntityPresence,
  ): PresenceInspection {
    const entity = this.entities.require(presence.entityId);
    return {
      entityId: entity.id,
      type: entity.type,
      layer: presence.layer,
      ...(presence.role ? { role: presence.role } : {}),
      stackOrder: presence.stackOrder,
      traits: presence.traits,
      ...(entity.state ? { state: structuredClone(entity.state) } : {}),
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
  transaction?: MovementTransaction,
): MoveResult {
  return {
    actorId,
    moved: false,
    blocked: true,
    from,
    to,
    direction,
    passage: { reason, confidence: "rule" },
    events: transaction ? [] : [],
  };
}

function pushUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value);
}
