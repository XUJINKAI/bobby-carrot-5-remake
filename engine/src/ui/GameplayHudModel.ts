import { EntityTypeId } from "@bobby/model";
import type { GameplayState } from "../core/GameplayState.js";
import type { WinConditionState } from "../world/WorldTypes.js";

const EGG_NEST_TARGET = "egg-nest";
const EGG_FILLER = "egg";

export interface GameplayHudTotals {
  goldenCarrots: number;
  bonusCoins: number;
}

export interface GameplayHudModel {
  objectives: {
    carrotRemaining: number | null;
    eggRemaining: number | null;
  };
  items: {
    key: boolean;
    speedShoes: boolean;
    gas: boolean;
    shovel: boolean;
    kite: boolean;
    beans: number;
    goldenCarrots: number;
    bonusCoins: number;
  };
}

/** Pure projection from public gameplay state to HUD semantics. */
export function buildGameplayHudModel(
  state: GameplayState,
  winState: WinConditionState | null,
  totals: GameplayHudTotals,
): GameplayHudModel {
  return {
    objectives: {
      carrotRemaining: remainingForCondition(
        winState,
        (item) =>
          item.type === "collect-all" && item.target === EntityTypeId.CARROT,
      ),
      eggRemaining: remainingForCondition(
        winState,
        (item) =>
          item.type === "fill-all" &&
          item.target === EGG_NEST_TARGET &&
          item.filler === EGG_FILLER,
      ),
    },
    items: {
      key: state.profile.superKey || state.profile.temporaryKey,
      speedShoes: state.profile.speedShoes,
      gas: state.inventory.gas,
      shovel: state.inventory.shovel,
      kite: state.inventory.kite,
      beans: Math.max(0, state.inventory.beans),
      goldenCarrots: Math.max(0, totals.goldenCarrots - state.goldenCarrotsInLevel),
      bonusCoins: Math.max(0, totals.bonusCoins - state.bonusCoinsInLevel),
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
