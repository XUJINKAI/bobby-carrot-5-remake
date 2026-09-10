import { MapEntityTypeId, type LevelMap } from "@bobby/model";
import type { AdventureEntityFieldPatch } from "./augment.js";
import { augmentAdventureLevel } from "./augment.js";
import { parseAdventureLevelId } from "./campaign.js";
import {
  normalizeAdventureSave,
  rewardClaimKey,
  type AdventureRewardClaim,
  type AdventureRewardType,
  type AdventureSave,
} from "./save.js";

export function createAdventureLevelInstance(
  levelId: string,
  level: LevelMap,
  save: AdventureSave,
  fieldPatches: readonly AdventureEntityFieldPatch[] = [],
): LevelMap {
  const augmented = augmentAdventureLevel(structuredClone(level), fieldPatches);
  const normalized = normalizeAdventureSave(save);
  const parsedLevel = parseAdventureLevelId(levelId);
  if (!parsedLevel) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  const claimed = new Set(normalized.claimedRewards.map(rewardClaimKey));
  return {
    ...augmented,
    entities: augmented.entities.filter((entity) => {
      if (!isAdventureRewardType(entity.type)) return true;
      return !claimed.has(
        rewardClaimKey({
          levelId: parsedLevel.id,
          type: entity.type,
          x: entity.x,
          y: entity.y,
        }),
      );
    }),
  };
}

export function claimAdventureReward(
  save: AdventureSave,
  claim: AdventureRewardClaim,
): AdventureSave {
  const next = structuredClone(normalizeAdventureSave(save));
  const key = rewardClaimKey(claim);
  if (next.claimedRewards.some((item) => rewardClaimKey(item) === key))
    return next;
  next.claimedRewards.push(structuredClone(claim));
  if (claim.type === MapEntityTypeId.BONUS_COIN)
    next.economy.bonusCoins += 1;
  else next.economy.goldenCarrots += 1;
  return normalizeAdventureSave(next);
}

export function addBonusCoins(
  save: AdventureSave,
  amount = 1,
): AdventureSave {
  const next = structuredClone(normalizeAdventureSave(save));
  next.economy.bonusCoins += Math.max(0, Math.floor(amount));
  return normalizeAdventureSave(next);
}

export function addGoldenCarrots(
  save: AdventureSave,
  amount = 1,
): AdventureSave {
  const next = structuredClone(normalizeAdventureSave(save));
  next.economy.goldenCarrots += Math.max(0, Math.floor(amount));
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

function isAdventureRewardType(type: string): type is AdventureRewardType {
  return (
    type === MapEntityTypeId.BONUS_COIN ||
    type === MapEntityTypeId.GOLDEN_CARROT
  );
}
