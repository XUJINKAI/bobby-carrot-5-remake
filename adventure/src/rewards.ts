import {
  ObjectId,
  type LevelMap,
  type LevelObject,
  type ObjectType,
} from "@bobby/model";
import {
  parseAdventureLevelId,
  type AdventureLevelId,
} from "./campaign.js";
import { normalizeAdventureSave, type AdventureSave } from "./save.js";
import {
  augmentAdventureLevel,
  type AdventureObjectPropertiesPatch,
} from "./augment.js";

export type PersistentRewardType =
  | typeof ObjectId.BONUS_COIN
  | typeof ObjectId.GOLDEN_CARROT;

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
  return level.objects.flatMap((object) => {
    if (!isPersistentRewardType(object.type)) return [];
    return [
      {
        id: persistentRewardId(parsed.id, object.type, object.x, object.y),
        levelId: parsed.id,
        type: object.type,
        x: object.x,
        y: object.y,
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
  propertyPatches: readonly AdventureObjectPropertiesPatch[] = [],
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
    objects: augmented.objects.filter((object) => {
      if (!isPersistentRewardType(object.type)) return true;
      const id = rewards.get(`${object.x},${object.y}:${object.type}`);
      return !id || !claimed.has(id);
    }),
  };
}

export function claimPersistentReward(
  save: AdventureSave,
  levelId: string,
  type: ObjectType,
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
  if (type === ObjectId.BONUS_COIN) next.economy.bonusCoins += 1;
  else if (type === ObjectId.GOLDEN_CARROT) next.economy.goldenCarrots += 1;
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
  type: ObjectType,
): type is PersistentRewardType {
  return type === ObjectId.BONUS_COIN || type === ObjectId.GOLDEN_CARROT;
}
