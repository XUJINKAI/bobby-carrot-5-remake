import { MapEntityTypeId } from "@bobby/model";
import type { GameplayState } from "../core/GameplayState.js";
import type { EntityId } from "../world/entity/EntityInstance.js";
import type { WinConditionState } from "../world/WorldTypes.js";

export interface GameplayHudInventory {
  actorId: EntityId;
  role: "primary" | "secondary";
  gas: boolean;
  shovel: boolean;
  kite: boolean;
  beans: number;
  lockKeys: number;
}

export interface GameplayHudModel {
  elapsedMs: number;
  moves: number;
  coins: number | null;
  timedChallengePhase: "waiting" | "running" | null;
  timedChallengeRemainingMs: number | null;
  objectives: {
    carrotRemaining: number | null;
    eggRemaining: number | null;
  };
  inventories: readonly GameplayHudInventory[];
}

/** Pure projection from public gameplay state to HUD semantics. */
export function buildGameplayHudModel(
  state: GameplayState,
  winState: WinConditionState | null,
  coins: number | null = null,
): GameplayHudModel {
  const actors = [...state.actors].sort((left, right) => {
    if (left.id === state.primaryActorId) return -1;
    if (right.id === state.primaryActorId) return 1;
    return 0;
  });
  return {
    elapsedMs: state.elapsedMs,
    moves: state.moves,
    coins,
    timedChallengePhase: state.timedChallengePhase,
    timedChallengeRemainingMs: state.timedChallengeRemainingMs,
    objectives: {
      carrotRemaining: remainingForCondition(
        winState,
        (item) =>
          item.type === "collect-all" && item.target === MapEntityTypeId.CARROT,
      ),
      eggRemaining: remainingForCondition(
        winState,
        (item) =>
          item.type === "fill-all" &&
          item.target === "egg-nest" &&
          item.filler === "filled-egg",
      ),
    },
    inventories: actors.slice(0, 2).map((actor, index) => {
      const inventory = actor.inventory;
      return {
        actorId: actor.id,
        role: index === 0 ? "primary" : "secondary",
        gas: inventory.gas,
        shovel: inventory.shovel,
        kite: inventory.kite,
        beans: Math.max(0, inventory.beans),
        lockKeys: Math.max(0, inventory.lockKeys),
      };
    }),
  };
}

export function remainingForCondition(
  state: WinConditionState | null,
  predicate: (state: WinConditionState) => boolean,
): number | null {
  if (!state) return null;
  if (state.type === "all" || state.type === "any") {
    for (const child of state.conditions) {
      const remaining = remainingForCondition(child, predicate);
      if (remaining !== null) return remaining;
    }
    return null;
  }
  if (!predicate(state)) return null;
  if (state.type === "collect-all" || state.type === "fill-all")
    return state.remaining;
  return null;
}
