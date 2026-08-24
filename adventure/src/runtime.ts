import { ObjectId, type ObjectType } from "@bobby/model";
import type { AdventureSessionPlan } from "./session.js";

export interface AdventureObservedWorldEvent {
  type: string;
  objectType?: ObjectType;
  action?: string;
}

export interface AdventureEnginePort {
  onWorldEvent(
    listener: (event: AdventureObservedWorldEvent) => void,
  ): () => void;
  killPlayer(reason: string): void;
}

export interface AdventureRuntime {
  readonly remainingMs: number | null;
  update(): void;
  reset(): void;
  destroy(): void;
}

export function createAdventureRuntime(
  plan: AdventureSessionPlan,
  engine: AdventureEnginePort,
  now: () => number = Date.now,
): AdventureRuntime {
  let deadlineMs: number | null = null;
  let remainingMs: number | null = null;

  const clear = (): void => {
    deadlineMs = null;
    remainingMs = null;
  };

  const unsubscribe = engine.onWorldEvent((event) => {
    if (
      event.type === "object-interaction" &&
      event.objectType === ObjectId.LOCK &&
      event.action === "open"
    ) {
      if (plan.timedChallengeMs !== null && deadlineMs === null) {
        remainingMs = plan.timedChallengeMs;
        deadlineMs = now() + plan.timedChallengeMs;
      }
      return;
    }
    if (event.type === "complete" || event.type === "death") clear();
  });

  return {
    get remainingMs(): number | null {
      return remainingMs;
    },
    update(): void {
      if (deadlineMs === null) return;
      remainingMs = Math.max(0, deadlineMs - now());
      if (remainingMs > 0) return;
      clear();
      engine.killPlayer("Bonus Round 的挑战时间耗尽");
    },
    reset(): void {
      clear();
    },
    destroy(): void {
      clear();
      unsubscribe();
    },
  };
}
