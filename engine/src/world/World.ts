import type { Direction, LevelMap, WinCondition } from "@bobby/model";
import {
  behaviorRegistry as builtinBehaviors,
  entityRegistry as builtinEntities,
} from "../entities/registry.js";
import type { WorldTick } from "../time/WorldClock.js";
import {
  createGlobalState,
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
  entities?: EntityRegistry;
  behaviors?: BehaviorRegistry;
  actions?: RuntimeActionRegistry;
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
  readonly playerId: EntityId;
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
    this.state = createGlobalState(options.profile, level.rules?.win);
    this.query = new WorldQueryApi(
      this.entities,
      this.spatial,
      this.registry,
      () => this.state,
    );
    const players = this.query.entitiesWithTrait("player");
    if (players.length !== 1)
      throw new Error(
        `LevelMap 必须恰好包含一个 player Entity，当前 ${players.length}`,
      );
    this.playerId = players[0]!.id;
    this.refreshDerivedState();
    this.evaluateCompletion([]);
  }

  get player(): CellPosition {
    return { ...this.entities.require(this.playerId).anchor };
  }

  get facing(): Direction {
    return this.entities.require(this.playerId).direction ?? "down";
  }

  get dead(): boolean {
    return this.state.dead;
  }

  get completed(): boolean {
    return this.state.completed;
  }

  get winState(): WinConditionState | null {
    return this.state.winCondition
      ? this.evaluateWin(this.state.winCondition)
      : null;
  }

  get forcedKind(): string | null {
    return this.state.forced?.kind ?? null;
  }

  get forcedDirection(): Direction | null {
    return this.state.forced?.direction ?? null;
  }

  get ridingMower(): boolean {
    return this.state.ridingMower;
  }

  get objectiveRemaining(): number {
    return this.state.objectiveRemaining;
  }

  get isPlayerClimbing(): boolean {
    return this.spatial.hasTraitAt(this.player, "climbable");
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

  setProfile(profile: Partial<ProfileCapabilities>): void {
    this.state.profile = { ...this.state.profile, ...profile };
  }

  startAction(spec: RuntimeActionSpec): RuntimeActionId {
    return this.actions.start(spec);
  }

  killPlayer(reason = "Bobby could not continue."): WorldEvent[] {
    if (this.state.dead) return [];
    this.state.dead = true;
    this.state.deathReason = reason;
    return [{ type: "death", reason }];
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
    const presences = this.spatial
      .presencesAt(cell)
      .map((presence) => this.inspectPresence(presence));
    const topPresence = presences.at(-1);
    return {
      cell,
      presences,
      ...(topPresence ? { topPresence } : {}),
      playerHere: this.player.x === x && this.player.y === y,
    };
  }

  move(direction: Direction, forced = false): MoveResult {
    const actor = this.entities.require(this.playerId);
    const from = { ...actor.anchor };
    const to = addDirection(from, direction);
    if (this.state.dead || this.state.completed)
      return blockedResult(from, to, direction, "world-finished");
    if (!this.spatial.inBounds(to))
      return blockedResult(from, to, direction, "void");

    const sourceStack = [...this.spatial.presencesAt(from)].reverse();
    const targetStack = [...this.spatial.presencesAt(to)].reverse();
    const queue = new CommandQueue();
    const leave = this.runPassage(
      sourceStack,
      actor,
      direction,
      queue,
      "canLeave",
    );
    if (!leave.passable)
      return blockedResult(
        from,
        to,
        direction,
        leave.reason ?? "leave-blocked",
      );

    let ignoredEntity: EntityId | null = null;
    const pushable = targetStack.find(
      (presence) =>
        presence.entityId !== actor.id && presence.traits.includes("pushable"),
    );
    if (pushable) {
      const pushTo = addDirection(to, direction);
      if (!this.canOccupy(pushTo, pushable.entityId)) {
        const touchEvents = this.runTouch(targetStack, actor, direction);
        return {
          ...blockedResult(from, to, direction, "push-blocked"),
          events: touchEvents,
        };
      }
      queue.move(pushable.entityId, pushTo.x, pushTo.y);
      ignoredEntity = pushable.entityId;
    }

    if (!this.hasSupport(to)) {
      const touchEvents = this.runTouch(targetStack, actor, direction);
      return {
        ...blockedResult(from, to, direction, "void"),
        events: touchEvents,
      };
    }

    const enter = this.runPassage(
      targetStack,
      actor,
      direction,
      queue,
      "canEnter",
      ignoredEntity,
    );
    if (!enter.passable) {
      const touchEvents = this.runTouch(targetStack, actor, direction);
      return {
        ...blockedResult(from, to, direction, enter.reason ?? "blocked"),
        events: touchEvents,
      };
    }

    for (const presence of sourceStack)
      this.runHook("onLeave", presence, actor, direction, queue);
    queue.move(actor.id, to.x, to.y);
    queue.setDirection(actor.id, direction);
    for (const presence of targetStack) {
      if (presence.entityId !== ignoredEntity)
        this.runHook("onEnter", presence, actor, direction, queue);
    }
    if (!forced) queue.setGlobal("moves", this.state.moves + 1);
    const events = this.commit(queue);
    this.refreshDerivedState();
    this.evaluateCompletion(events);
    if (
      this.rules?.maxMoves !== undefined &&
      this.state.moves > this.rules.maxMoves &&
      !this.state.completed
    )
      events.push(...this.killPlayer(`Move limit exceeded: ${this.rules.maxMoves}`));
    return {
      moved: true,
      from,
      to: this.player,
      direction,
      passage: { reason: "passable", confidence: "rule" },
      events,
    };
  }

  /** RuntimeAction 与 Behavior 都只在统一 WorldTick 上推进。 */
  update(time: WorldTick): WorldEvent[] {
    if (time.stepMs <= 0 || this.state.dead || this.state.completed) return [];
    const queue = new CommandQueue();

    // 先推进上一 Tick 已经存在的跨时过程；本 Tick 新建 Action 从下一 Tick 才开始计时。
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
        time,
      );
      for (const behavior of this.resolveBehaviors(entity, presence))
        behavior.onTick?.(context);
    }
    const events = this.commit(queue);
    this.refreshDerivedState();
    this.evaluateCompletion(events);
    return events;
  }

  private canOccupy(
    cell: CellPosition,
    movingEntityId: EntityId,
  ): boolean {
    if (!this.spatial.inBounds(cell) || !this.hasSupport(cell)) return false;
    return !this.spatial.presencesAt(cell).some(
      (presence) =>
        presence.entityId !== movingEntityId &&
        (presence.traits.includes("blocking") ||
          presence.traits.includes("pushable")),
    );
  }

  private hasSupport(cell: CellPosition): boolean {
    return this.spatial.presencesAt(cell).some(
      (presence) =>
        presence.stackBand === "surface" &&
        (presence.traits.includes("walkable") ||
          presence.traits.includes("water") ||
          presence.traits.includes("forced-movement") ||
          presence.traits.includes("push-goal")),
    );
  }

  private runPassage(
    stack: readonly EntityPresence[],
    actor: EntityInstance,
    direction: Direction,
    queue: CommandQueue,
    hook: "canEnter" | "canLeave",
    ignoredEntity: EntityId | null = null,
  ): PassageResult {
    for (const presence of stack) {
      if (
        presence.entityId === actor.id ||
        presence.entityId === ignoredEntity
      )
        continue;
      const entity = this.entities.require(presence.entityId);
      let explicitPass = false;
      for (const behavior of this.resolveBehaviors(entity, presence)) {
        const result = behavior[hook]?.(
          this.context(actor, presence, entity, direction, queue),
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
  ): WorldEvent[] {
    const queue = new CommandQueue();
    for (const presence of stack) {
      if (presence.entityId === actor.id) continue;
      this.runHook("onTouch", presence, actor, direction, queue);
    }
    const events = this.commit(queue);
    this.refreshDerivedState();
    this.evaluateCompletion(events);
    return events;
  }

  private runHook(
    hook: "onEnter" | "onLeave" | "onTouch",
    presence: EntityPresence,
    actor: EntityInstance,
    direction: Direction,
    queue: CommandQueue,
  ): void {
    const entity = this.entities.get(presence.entityId);
    if (!entity) return;
    const context = this.context(
      actor,
      presence,
      entity,
      direction,
      queue,
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
    time?: WorldTick,
  ): BehaviorContext {
    return {
      query: this.query,
      commands: queue,
      actor,
      self: { entity: self, presence },
      ...(direction ? { direction } : {}),
      ...(time ? { time } : {}),
    };
  }

  private commit(queue: CommandQueue): WorldEvent[] {
    const events: WorldEvent[] = [];
    for (const command of queue.drain()) {
      switch (command.type) {
        case "spawn": {
          const entity = this.entities.spawn(command.entity);
          this.spatial.addEntity(entity);
          break;
        }
        case "destroy":
          this.actions.cancelOwnedBy(command.entityId);
          this.spatial.removeEntity(command.entityId);
          this.entities.destroy(command.entityId);
          break;
        case "move":
          if (this.entities.get(command.entityId))
            this.spatial.moveEntity(command.entityId, {
              x: command.x,
              y: command.y,
            });
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
          if (entity) entity.state = structuredClone(command.state);
          break;
        }
        case "set-global":
          (this.state as unknown as Record<string, unknown>)[command.key] =
            structuredClone(command.value);
          break;
        case "start-action":
          this.actions.start(command.action);
          break;
        case "cancel-action":
          this.actions.cancel(command.actionId);
          break;
        case "emit":
          events.push(command.event);
          break;
      }
    }
    return events;
  }

  private refreshDerivedState(): void {
    const objectives = this.query.entitiesWithTrait("level-objective");
    this.state.objectiveRemaining = objectives.length;
    this.state.objectiveTotal = Math.max(
      this.state.objectiveTotal,
      objectives.length,
    );
    if (this.query.entitiesWithTrait("objective-carrot").length > 0)
      this.state.objectiveMode = "carrot";
    else if (this.query.entitiesWithTrait("objective-nest").length > 0)
      this.state.objectiveMode = "nest";
    else this.state.objectiveMode = "generic";
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
      case "reach":
        return {
          type: "reach",
          target: condition.target,
          completed: this.hasSelectorAt(this.player, condition.target),
        };
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
      ...(presence.role ? { role: presence.role } : {}),
      stackBand: presence.stackBand,
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
  from: CellPosition,
  to: CellPosition,
  direction: Direction,
  reason: string,
): MoveResult {
  return {
    moved: false,
    blocked: true,
    from,
    to,
    direction,
    passage: { reason, confidence: "rule" },
    events: [],
  };
}
