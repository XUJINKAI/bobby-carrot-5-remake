import type { EntityId } from "../entity/EntityInstance.js";

export type ActorLifecyclePhase = "active" | "downed" | "eliminated";

export interface ActorLifecycleState {
  entityId: EntityId;
  phase: ActorLifecyclePhase;
  reason?: string;
  changedAtMs: number;
}

export interface ActorLifecycleSnapshot {
  actors: ActorLifecycleState[];
}

/** 每个 actor 独立的 gameplay 生命周期；倒下不等于整个 World 失败。 */
export class ActorLifecycleStore {
  private readonly actors = new Map<EntityId, ActorLifecycleState>();

  get all(): readonly ActorLifecycleState[] {
    return [...this.actors.values()]
      .sort((a, b) => a.entityId - b.entityId)
      .map(cloneState);
  }

  state(entityId: EntityId): Readonly<ActorLifecycleState> {
    return cloneState(this.ensure(entityId));
  }

  isActive(entityId: EntityId): boolean {
    return this.ensure(entityId).phase === "active";
  }

  down(
    entityId: EntityId,
    reason: string,
    changedAtMs: number,
  ): ActorLifecycleState | undefined {
    const current = this.ensure(entityId);
    if (current.phase !== "active") return undefined;
    return this.change(entityId, "downed", changedAtMs, reason);
  }

  revive(entityId: EntityId, changedAtMs: number): ActorLifecycleState | undefined {
    const current = this.ensure(entityId);
    if (current.phase !== "downed") return undefined;
    return this.change(entityId, "active", changedAtMs);
  }

  eliminate(
    entityId: EntityId,
    reason: string,
    changedAtMs: number,
  ): ActorLifecycleState | undefined {
    const current = this.ensure(entityId);
    if (current.phase === "eliminated") return undefined;
    return this.change(entityId, "eliminated", changedAtMs, reason);
  }

  snapshot(): ActorLifecycleSnapshot {
    return { actors: this.all.map(cloneState) };
  }

  restore(snapshot: ActorLifecycleSnapshot): void {
    this.actors.clear();
    for (const source of snapshot.actors)
      this.actors.set(source.entityId, cloneState(source));
  }

  private ensure(entityId: EntityId): ActorLifecycleState {
    let state = this.actors.get(entityId);
    if (!state) {
      state = { entityId, phase: "active", changedAtMs: 0 };
      this.actors.set(entityId, state);
    }
    return state;
  }

  private change(
    entityId: EntityId,
    phase: ActorLifecyclePhase,
    changedAtMs: number,
    reason?: string,
  ): ActorLifecycleState {
    const state: ActorLifecycleState = {
      entityId,
      phase,
      changedAtMs: Math.max(0, changedAtMs),
      ...(reason ? { reason } : {}),
    };
    this.actors.set(entityId, state);
    return cloneState(state);
  }
}

function cloneState(state: ActorLifecycleState): ActorLifecycleState {
  return structuredClone(state);
}
