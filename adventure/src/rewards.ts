import {
  EntityTypeId,
  type EntityType,
  type LevelMap,
} from "@bobby/model";
import {
  parseAdventureLevelId,
  type AdventureLevelId,
} from "./campaign.js";
import { normalizeAdventureSave, type AdventureSave } from "./save.js";
import {
  augmentAdventureLevel,
  type AdventureEntityPropertiesPatch,
} from "./augment.js";

export type PersistentRewardType =
  | typeof EntityTypeId.BONUS_COIN
  | typeof EntityTypeId.GOLDEN_CARROT;

export interface PersistentReward {
  id: string;
  levelId: AdventureLevelId;
  type: PersistentRewardType;
  x: number;
  y: number;
}

export function persistentRewardsForLevel(
  levelId: string,
  level: LevelMap,
): PersistentReward[] {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  return level.entities.flatMap((entity) => {
    if (!isPersistentRewardType(entity.type)) return [];
    return [
      {
        id: persistentRewardId(parsed.id, entity.type, entity.x, entity.y),
        levelId: parsed.id,
        type: entity.type,
        x: entity.x,
        y: entity.y,
      },
    ];
  });
}

export function persistentRewardId(
  levelId: AdventureLevelId,
  type: PersistentRewardType,
  x: number,
  y: number,
): string {
  return `${levelId}:${type}:${x},${y}`;
}

export function createAdventureLevelInstance(
  levelId: string,
  level: LevelMap,
  save: AdventureSave,
  propertyPatches: readonly AdventureEntityPropertiesPatch[] = [],
): LevelMap {
  const augmented = augmentAdventureLevel(structuredClone(level), propertyPatches);
  const claimed = new Set(normalizeAdventureSave(save).claimedRewards);
  const rewards = new Map(
    persistentRewardsForLevel(levelId, augmented).map((reward) => [
      `${reward.x},${reward.y}:${reward.type}`,
      reward.id,
    ]),
  );
  return {
    ...augmented,
    entities: augmented.entities.filter((entity) => {
      if (!isPersistentRewardType(entity.type)) return true;
      const id = rewards.get(`${entity.x},${entity.y}:${entity.type}`);
      return !id || !claimed.has(id);
    }),
  };
}

export function claimPersistentReward(
  save: AdventureSave,
  levelId: string,
  type: EntityType,
  x: number,
  y: number,
): AdventureSave {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed || !isPersistentRewardType(type))
    return normalizeAdventureSave(save);
  const id = persistentRewardId(parsed.id, type, x, y);
  const next = structuredClone(normalizeAdventureSave(save));
  if (next.claimedRewards.includes(id)) return next;
  next.claimedRewards.push(id);
  if (type === EntityTypeId.BONUS_COIN) next.economy.bonusCoins += 1;
  else if (type === EntityTypeId.GOLDEN_CARROT) next.economy.goldenCarrots += 1;
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

function isPersistentRewardType(
  type: EntityType,
): type is PersistentRewardType {
  return type === EntityTypeId.BONUS_COIN || type === EntityTypeId.GOLDEN_CARROT;
}
