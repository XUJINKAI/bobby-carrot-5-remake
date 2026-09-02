import {
  parseAdventureLevelId,
  type AdventureLevelId,
} from "./campaign.js";
import {
  hasAdventureItem,
  normalizeAdventureSave,
  type AdventureSave,
} from "./save.js";

export const BONUS_KEY_TRIAL_EVENT = "bonus-key-trial";

export interface AdventureCapabilities {
  speedShoes: boolean;
  coinRadar: boolean;
  goldenKey: boolean;
  bonusKeyTrialUsed: boolean;
}

export interface AdventureProfilePlan {
  capabilities: AdventureCapabilities;
  economy: {
    bonusCoins: number;
    goldenCarrots: number;
  };
}

export interface AdventureSessionPlan extends AdventureProfilePlan {
  levelId: AdventureLevelId;
}

export function planAdventureProfile(save: AdventureSave): AdventureProfilePlan {
  const normalized = normalizeAdventureSave(save);
  return {
    capabilities: {
      speedShoes: hasAdventureItem(normalized, "speed-shoes"),
      coinRadar: hasAdventureItem(normalized, "coin-radar"),
      goldenKey: hasAdventureItem(normalized, "golden-key"),
      bonusKeyTrialUsed: normalized.campaign.completedEvents.includes(
        BONUS_KEY_TRIAL_EVENT,
      ),
    },
    economy: { ...normalized.economy },
  };
}

export function planAdventureSession(
  levelId: string,
  save: AdventureSave,
): AdventureSessionPlan {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  return {
    levelId: parsed.id,
    ...planAdventureProfile(save),
  };
}
