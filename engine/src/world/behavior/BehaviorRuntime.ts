import type { Direction } from "@bobby/model";
import type { WorldTick } from "../../time/WorldClock.js";
import type { EntityInstance } from "../entity/EntityInstance.js";
import type { MovementContext } from "./Behavior.js";
import type { EntityPresence } from "../spatial/EntityPresence.js";
import type { EntityRegistry } from "../entity/EntityRegistry.js";
import type { SpatialIndex } from "../spatial/SpatialIndex.js";
import type { Behavior, BehaviorContext } from "./Behavior.js";
import type { BehaviorRegistry } from "./BehaviorRegistry.js";
import type { CommandQueue } from "./CommandQueue.js";
import type { WorldQueryApi } from "./WorldQueryApi.js";

export type BehaviorMovementHook =
  | "onArrive"
  | "onEnter"
  | "onLeave"
  | "onTouch";

/** Behavior 的解析与上下文组装入口，供 movement resolver 和 marker phase 共用。 */
export class BehaviorRuntime {
  constructor(
    private readonly registry: EntityRegistry,
    private readonly behaviors: BehaviorRegistry,
    private readonly entities: {
      get(id: number): EntityInstance | undefined;
    },
    private readonly spatial: SpatialIndex,
    private readonly query: WorldQueryApi,
  ) {}

  resolve(
    entity: EntityInstance,
    presence: EntityPresence,
  ): readonly Behavior[] {
    const definition = this.registry.require(entity.type);
    return this.behaviors.resolve(definition.behaviors, presence.traits);
  }

  resolveForMovement(entity: EntityInstance): readonly Behavior[] {
    const definition = this.registry.require(entity.type);
    const traits = new Set(
      this.spatial
        .presencesForEntity(entity.id)
        .flatMap((presence) => [...presence.traits]),
    );
    return this.behaviors.resolve(definition.behaviors, [...traits]);
  }

  context(
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

  initialize(
    entity: EntityInstance,
    presence: EntityPresence,
    queue: CommandQueue,
  ): void {
    const context = {
      self: { entity, presence },
      query: this.query,
      commands: queue,
    };
    for (const behavior of this.resolve(entity, presence))
      behavior.onInitialize?.(context);
  }

  runHook(
    hook: BehaviorMovementHook,
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
    for (const behavior of this.resolve(entity, presence))
      behavior[hook]?.(context);
  }
}
