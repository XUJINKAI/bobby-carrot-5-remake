import type { GlobalState } from "../GlobalState.js";
import type { WorldDeltaSequence } from "../delta/WorldDelta.js";
import type { EntityId } from "../entity/EntityInstance.js";
import type { MovementRuntime } from "../movement/MovementRuntime.js";
import type { WorldStepResult } from "../movement/WorldStepResult.js";
import type { WorldOutcomeStore } from "../outcome/WorldOutcome.js";
import type { WorldQueryApi } from "../behavior/WorldQueryApi.js";
import type { WorldEvent } from "../WorldTypes.js";
import type { WorldRuleEvaluator } from "../WorldRuleEvaluator.js";
import type { ActorLifecycleStore } from "./ActorLifecycle.js";

export interface LifecycleClock {
  worldTick: number | null;
  worldTimeMs: number;
}

/** 汇总 actor-local 生命周期、空间过程和 World 终局，不参与实体规则解析。 */
export class WorldLifecycle {
  constructor(
    private readonly actors: ActorLifecycleStore,
    private readonly outcome: WorldOutcomeStore,
    private readonly movement: MovementRuntime,
    private readonly query: WorldQueryApi,
    private readonly rules: WorldRuleEvaluator,
    private readonly state: () => GlobalState,
    private readonly sequence: WorldDeltaSequence,
    private readonly clock: () => LifecycleClock,
  ) {}

  initialize(): void {
    for (const actor of this.query.entitiesWithTrait("player"))
      this.actors.state(actor.id);
    this.rules.refreshDerivedState();
    if (this.rules.completionReady(false)) this.finish("won");
    else this.syncLegacyState();
  }

  settle(result: WorldStepResult, preferredActorId?: EntityId): void {
    const changedActorIds = new Set(
      result.deltas
        .filter((delta) => delta.type === "actor-lifecycle-changed")
        .map((delta) => delta.actor.entityId),
    );
    if (preferredActorId !== undefined) changedActorIds.add(preferredActorId);
    for (const actorId of changedActorIds) this.interruptInactive(actorId, result);

    if (!this.outcome.playing) {
      this.syncLegacyState();
      return;
    }
    const playerIds = this.query
      .entitiesWithTrait("player")
      .map((actor) => actor.id);
    if (
      playerIds.length === 0 ||
      playerIds.some((actorId) => this.actors.isActive(actorId))
    ) {
      this.syncLegacyState();
      return;
    }
    const actorId = preferredActorId ?? playerIds[0];
    const reason =
      this.actors.state(actorId).reason ?? "No active player remains.";
    this.finish("lost", result, reason, actorId);
  }

  evaluateRules(result: WorldStepResult): void {
    this.rules.refreshDerivedState();
    if (!this.outcome.playing) return;
    if (this.rules.completionReady(this.movement.running.length > 0)) {
      this.finish("won", result);
      return;
    }
    const reason = this.rules.exceededLimitReason();
    if (reason) this.finish("lost", result, reason);
  }

  syncLegacyState(): void {
    const state = this.state();
    const outcome = this.outcome.state;
    state.dead = outcome.phase === "lost";
    state.completed = outcome.phase === "won";
    state.deathReason =
      outcome.phase === "lost" ? outcome.reason ?? null : null;
  }

  private interruptInactive(actorId: EntityId, result: WorldStepResult): void {
    const lifecycle = this.actors.state(actorId);
    const motion = this.movement.motions.forEntity(actorId);
    if (lifecycle.phase === "active" || motion?.status !== "running") return;
    const interrupted = this.movement.interruptEntity(
      actorId,
      lifecycle.reason ?? "actor-downed",
      motion.progress,
    );
    if (!interrupted) return;
    result.deltas.push(
      this.sequence.create(
        { type: "motion-interrupted", motion: interrupted },
        this.clock(),
      ),
    );
  }

  private finish(
    phase: "won" | "lost",
    result?: WorldStepResult,
    reason = "The world could not continue.",
    actorId?: EntityId,
  ): void {
    const state = this.state();
    const outcome =
      phase === "won"
        ? this.outcome.win(state.elapsedMs)
        : this.outcome.lose(reason, state.elapsedMs, actorId);
    if (!outcome) return;
    this.syncLegacyState();
    if (!result) return;

    result.deltas.push(
      this.sequence.create(
        { type: "world-outcome-changed", outcome },
        this.clock(),
      ),
    );
    const event: WorldEvent =
      phase === "won"
        ? { type: "complete" }
        : {
            type: "death",
            ...(actorId !== undefined ? { entityId: actorId } : {}),
            reason,
          };
    result.events.push(event);
    result.deltas.push(
      this.sequence.create({ type: "world-event", event }, this.clock()),
    );
    pushUnique(result.mutations.globalsChanged, "dead");
    pushUnique(result.mutations.globalsChanged, "completed");
    pushUnique(result.mutations.globalsChanged, "deathReason");
  }
}

function pushUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) values.push(value);
}
