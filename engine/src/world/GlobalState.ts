import type { CellPosition } from "./entity/EntityInstance.js";

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

/** 非空间、非 actor-local 的 gameplay 状态。 */
export interface GlobalState {
  dead: boolean;
  completed: boolean;
  deathReason: string | null;
  moves: number;
  elapsedMs: number;
  economy: EconomyState;
  profile: ProfileCapabilities;
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
    bonusCoinsInLevel: 0,
    goldenCarrotsInLevel: 0,
    lastReachedSelectors: [],
    fireTrail: [],
    warnings: [],
    logicRemainderMs: 0,
  };
}
