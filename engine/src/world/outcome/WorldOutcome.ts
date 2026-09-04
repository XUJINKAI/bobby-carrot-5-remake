import type { EntityId } from "../entity/EntityInstance.js";

export type WorldOutcomePhase = "playing" | "won" | "lost";

export interface WorldOutcomeState {
  phase: WorldOutcomePhase;
  reason?: string;
  actorId?: EntityId;
  changedAtMs: number;
}

/** 关卡终局与 actor 生命周期分离；World 只允许从 playing 进入一个终态。 */
export class WorldOutcomeStore {
  private value: WorldOutcomeState = { phase: "playing", changedAtMs: 0 };

  get state(): Readonly<WorldOutcomeState> {
    return structuredClone(this.value);
  }

  get playing(): boolean {
    return this.value.phase === "playing";
  }

  win(changedAtMs: number): WorldOutcomeState | undefined {
    return this.finish("won", changedAtMs);
  }

  lose(
    reason: string,
    changedAtMs: number,
    actorId?: EntityId,
  ): WorldOutcomeState | undefined {
    return this.finish("lost", changedAtMs, reason, actorId);
  }

  restore(state: WorldOutcomeState): void {
    this.value = structuredClone(state);
  }

  private finish(
    phase: Exclude<WorldOutcomePhase, "playing">,
    changedAtMs: number,
    reason?: string,
    actorId?: EntityId,
  ): WorldOutcomeState | undefined {
    if (!this.playing) return undefined;
    this.value = {
      phase,
      changedAtMs: Math.max(0, changedAtMs),
      ...(reason ? { reason } : {}),
      ...(actorId !== undefined ? { actorId } : {}),
    };
    return this.state;
  }
}
