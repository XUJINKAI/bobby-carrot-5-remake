import type { GlobalState } from "./GlobalState.js";
import type { ActorLifecycleStore } from "./actor/ActorLifecycle.js";
import type { RuntimeActionScheduler } from "./action/RuntimeActionScheduler.js";
import type {
  WorldDelta,
  WorldDeltaSequence,
} from "./delta/WorldDelta.js";
import type { MovementRuntime } from "./movement/MovementRuntime.js";
import type { WorldOutcomeStore } from "./outcome/WorldOutcome.js";
import {
  emptyMutationSummary,
  type WorldMutationSummary,
} from "./movement/WorldStepResult.js";
import type { CommandQueue } from "./behavior/CommandQueue.js";
import type { EntityStore } from "./entity/EntityStore.js";
import type { SpatialIndex } from "./spatial/SpatialIndex.js";
import type { WorldEvent } from "./WorldTypes.js";

export interface WorldCommitResult {
  events: WorldEvent[];
  mutations: WorldMutationSummary;
  deltas: WorldDelta[];
}

export interface WorldDeltaClock {
  worldTick: number | null;
  worldTimeMs: number;
}

/** CommandQueue 的唯一提交边界，同时产生可保持因果顺序的 WorldDelta。 */
export class WorldCommitter {
  constructor(
    private readonly entities: EntityStore,
    private readonly spatial: SpatialIndex,
    private readonly actions: RuntimeActionScheduler,
    private readonly movement: MovementRuntime,
    private readonly actors: ActorLifecycleStore,
    private readonly outcome: WorldOutcomeStore,
    private readonly state: () => GlobalState,
    private readonly sequence: WorldDeltaSequence,
  ) {}

  commit(queue: CommandQueue, clock: WorldDeltaClock): WorldCommitResult {
    const events: WorldEvent[] = [];
    const mutations = emptyMutationSummary();
    const deltas: WorldDelta[] = [];
    const record = (payload: Parameters<WorldDeltaSequence["create"]>[0]) =>
      deltas.push(this.sequence.create(payload, clock));

    for (const command of queue.drain()) {
      switch (command.type) {
        case "spawn": {
          const entity = this.entities.spawn(command.entity);
          this.spatial.addEntity(entity);
          pushUnique(mutations.spawned, entity.id);
          record({ type: "entity-spawned", entityId: entity.id });
          break;
        }
        case "destroy":
          this.actions.cancelOwnedBy(command.entityId);
          this.movement.clearEntity(command.entityId);
          this.spatial.removeEntity(command.entityId);
          this.entities.destroy(command.entityId);
          pushUnique(mutations.destroyed, command.entityId);
          record({ type: "entity-destroyed", entityId: command.entityId });
          break;
        case "move": {
          const entity = this.entities.get(command.entityId);
          if (entity) {
            const from = { ...entity.anchor };
            const to = { x: command.x, y: command.y };
            this.spatial.moveEntity(command.entityId, to);
            pushUnique(mutations.moved, command.entityId);
            record({ type: "entity-moved", entityId: entity.id, from, to });
          }
          break;
        }
        case "set-direction": {
          const entity = this.entities.get(command.entityId);
          if (entity) {
            entity.direction = command.direction;
            this.spatial.rebuildEntity(entity.id);
            record({ type: "entity-direction-changed", entityId: entity.id });
          }
          break;
        }
        case "set-state": {
          const entity = this.entities.get(command.entityId);
          if (entity) {
            entity.state = structuredClone(command.state);
            pushUnique(mutations.stateChanged, command.entityId);
            record({
              type: "entity-state-changed",
              entityId: entity.id,
              state: structuredClone(command.state),
            });
          }
          break;
        }
        case "down-actor": {
          const actor = this.actors.down(
            command.entityId,
            command.reason,
            clock.worldTimeMs,
          );
          if (!actor) break;
          this.actions.cancelOwnedBy(actor.entityId);
          const event: WorldEvent = {
            type: "actor-downed",
            entityId: actor.entityId,
            reason: command.reason,
          };
          events.push(event);
          record({ type: "actor-lifecycle-changed", actor });
          record({ type: "world-event", event });
          break;
        }
        case "revive-actor": {
          const actor = this.actors.revive(command.entityId, clock.worldTimeMs);
          if (!actor) break;
          const event: WorldEvent = {
            type: "actor-revived",
            entityId: actor.entityId,
          };
          events.push(event);
          record({ type: "actor-lifecycle-changed", actor });
          record({ type: "world-event", event });
          break;
        }
        case "eliminate-actor": {
          const actor = this.actors.eliminate(
            command.entityId,
            command.reason,
            clock.worldTimeMs,
          );
          if (!actor) break;
          this.actions.cancelOwnedBy(actor.entityId);
          const event: WorldEvent = {
            type: "actor-eliminated",
            entityId: actor.entityId,
            reason: command.reason,
          };
          events.push(event);
          record({ type: "actor-lifecycle-changed", actor });
          record({ type: "world-event", event });
          break;
        }
        case "lose-world": {
          const outcome = this.outcome.lose(
            command.reason,
            clock.worldTimeMs,
            command.actorId,
          );
          if (!outcome) break;
          const event: WorldEvent = {
            type: "death",
            ...(command.actorId !== undefined
              ? { entityId: command.actorId }
              : {}),
            reason: command.reason,
          };
          events.push(event);
          record({ type: "world-outcome-changed", outcome });
          record({ type: "world-event", event });
          break;
        }
        case "set-global":
          (this.state() as unknown as Record<string, unknown>)[command.key] =
            structuredClone(command.value);
          pushUnique(mutations.globalsChanged, command.key);
          record({ type: "global-state-changed", key: command.key });
          break;
        case "start-action": {
          const id = this.actions.start(command.action);
          pushUnique(mutations.actionsStarted, id);
          record({ type: "action-started", actionId: id });
          break;
        }
        case "cancel-action":
          this.actions.cancel(command.actionId);
          pushUnique(mutations.actionsCancelled, command.actionId);
          record({ type: "action-cancelled", actionId: command.actionId });
          break;
        case "emit":
          events.push(command.event);
          record({ type: "world-event", event: command.event });
          break;
      }
    }
    return { events, mutations, deltas };
  }
}

function pushUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value);
}
