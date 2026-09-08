import { MapEntityTypeId } from "@bobby/model";
import type { GameplayState } from "../core/GameplayState.js";
import type { WinConditionState } from "../world/WorldTypes.js";

export interface GameplayHudModel {
  objectives: {
    carrotRemaining: number | null;
    eggRemaining: number | null;
  };
  inventory: {
    key: boolean;
    speedShoes: boolean;
    gas: boolean;
    shovel: boolean;
    kite: boolean;
    beans: number;
  };
  economy: {
    goldenCarrots: number;
    bonusCoins: number;
  };
}

/** Pure projection from public gameplay state to HUD semantics. */
export function buildGameplayHudModel(
  state: GameplayState,
  winState: WinConditionState | null,
): GameplayHudModel {
  return {
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
    inventory: {
      key: state.inventory.temporaryKey,
      speedShoes: state.profile.speedShoes,
      gas: state.inventory.gas,
      shovel: state.inventory.shovel,
      kite: state.inventory.kite,
      beans: Math.max(0, state.inventory.beans),
    },
    economy: {
      goldenCarrots: state.economy.goldenCarrots,
      bonusCoins: state.economy.bonusCoins,
    },
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
