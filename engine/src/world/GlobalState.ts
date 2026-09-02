import type { Direction } from "@bobby/model";
import type { CellPosition } from "./entity/EntityInstance.js";

export interface InventoryState {
  gas: boolean;
  kite: boolean;
  shovel: boolean;
  beans: number;
  temporaryKey: boolean;
}

export interface EconomyState {
  bonusCoins: number;
  goldenCarrots: number;
}

export interface ProfileCapabilities {
  superKey: boolean;
  speedShoes: boolean;
  coinRadar: boolean;
  bonusKeyTrialUsed: boolean;
}

export type ForcedKind = "speed" | "ice" | "tide" | "flight" | "leaf" | "mower-exit";
export interface ForcedMovement { kind: ForcedKind; direction: Direction; }

/** 非空间 gameplay 状态。空间身份与实例 state 只存在于 EntityStore。 */
export interface GlobalState {
  dead: boolean;
  completed: boolean;
  deathReason: string | null;
  moves: number;
  elapsedMs: number;
  inventory: InventoryState;
  economy: EconomyState;
  profile: ProfileCapabilities;
  ridingMower: boolean;
  forced: ForcedMovement | null;
  bonusCoinsInLevel: number;
  goldenCarrotsInLevel: number;
  /** 本次成功移动进入格子的 selector 快照；允许 reach 匹配 onEnter 中被消费的实体。 */
  lastReachedSelectors: string[];
  fireTrail: CellPosition[];
  warnings: string[];
  logicRemainderMs: number;
}

export function createGlobalState(
  profile: Partial<ProfileCapabilities> = {},
  economy: Partial<EconomyState> = {},
): GlobalState {
  return {
    dead: false,
    completed: false,
    deathReason: null,
    moves: 0,
    elapsedMs: 0,
    inventory: { gas: false, kite: false, shovel: false, beans: 0, temporaryKey: false },
    economy: {
      bonusCoins: Math.max(0, Math.floor(economy.bonusCoins ?? 0)),
      goldenCarrots: Math.max(0, Math.floor(economy.goldenCarrots ?? 0)),
    },
    profile: {
      superKey: profile.superKey ?? false,
      speedShoes: profile.speedShoes ?? false,
      coinRadar: profile.coinRadar ?? false,
      bonusKeyTrialUsed: profile.bonusKeyTrialUsed ?? false,
    },
    ridingMower: false,
    forced: null,
    bonusCoinsInLevel: 0,
    goldenCarrotsInLevel: 0,
    lastReachedSelectors: [],
    fireTrail: [],
    warnings: [],
    logicRemainderMs: 0,
  };
}
