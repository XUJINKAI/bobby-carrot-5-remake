import { MapEntityTypeId } from "@bobby/model";
import {
  completeAdventureLevel,
  normalizeAdventureSave,
  type AdventureSave,
} from "./save.js";

export interface AdventureLevelRewards {
  bonusCoins: number;
  goldenCarrots: number;
}

export type AdventureLevelRewardType =
  | typeof MapEntityTypeId.BONUS_COIN
  | typeof MapEntityTypeId.GOLDEN_CARROT;

export function createAdventureLevelRewards(): AdventureLevelRewards {
  return { bonusCoins: 0, goldenCarrots: 0 };
}

export function collectAdventureLevelReward(
  rewards: AdventureLevelRewards,
  type: AdventureLevelRewardType,
): AdventureLevelRewards {
  const next = normalizeAdventureLevelRewards(rewards);
  if (type === MapEntityTypeId.BONUS_COIN) next.bonusCoins += 1;
  else next.goldenCarrots += 1;
  return next;
}

/** 关卡进度与本局奖励在同一次 Save 归约中提交。 */
export function settleAdventureLevelCompletion(
  save: AdventureSave,
  levelId: string,
  rewards: AdventureLevelRewards,
): AdventureSave {
  const next = completeAdventureLevel(save, levelId);
  const earned = normalizeAdventureLevelRewards(rewards);
  next.economy.bonusCoins += earned.bonusCoins;
  next.economy.goldenCarrots += earned.goldenCarrots;
  return normalizeAdventureSave(next);
}

export function spendBonusCoins(
  save: AdventureSave,
  amount: number,
): AdventureSave {
  const cost = Math.max(0, Math.floor(amount));
  const next = structuredClone(normalizeAdventureSave(save));
  if (next.economy.bonusCoins < cost) throw new Error("Bonus Coin 不足");
  next.economy.bonusCoins -= cost;
  return normalizeAdventureSave(next);
}

export function spendGoldenCarrots(
  save: AdventureSave,
  amount: number,
): AdventureSave {
  const cost = Math.max(0, Math.floor(amount));
  const next = structuredClone(normalizeAdventureSave(save));
  if (next.economy.goldenCarrots < cost) throw new Error("Golden Carrot 不足");
  next.economy.goldenCarrots -= cost;
  return normalizeAdventureSave(next);
}

function normalizeAdventureLevelRewards(
  rewards: AdventureLevelRewards,
): AdventureLevelRewards {
  return {
    bonusCoins: rewardCount(rewards.bonusCoins),
    goldenCarrots: rewardCount(rewards.goldenCarrots),
  };
}

function rewardCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
