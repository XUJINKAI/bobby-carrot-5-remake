import type { LevelMap } from "@bobby/model";
import type { AdventureEntityFieldPatch } from "./augment.js";
import { augmentAdventureLevel } from "./augment.js";
import { normalizeAdventureSave, type AdventureSave } from "./save.js";

export function createAdventureLevelInstance(
  _levelId: string,
  level: LevelMap,
  _save: AdventureSave,
  fieldPatches: readonly AdventureEntityFieldPatch[] = [],
): LevelMap {
  return augmentAdventureLevel(structuredClone(level), fieldPatches);
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
