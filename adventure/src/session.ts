import { EntityTypeId } from "@bobby/model";
import type { AdventureEntityFieldPatch } from "./augment.js";
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

/** Adventure-specific policy values materialized as canonical flat Map fields. */
export interface AdventureBonusRuntimePolicy {
  temporaryKeyVendor: {
    interaction: string;
    priceBonusCoins: number;
  };
  lock: {
    deathCountdownSeconds: number;
  };
}

export interface AdventureRuntimePolicy {
  bonus: AdventureBonusRuntimePolicy;
}

export const DEFAULT_ADVENTURE_RUNTIME_POLICY: AdventureRuntimePolicy = {
  bonus: {
    temporaryKeyVendor: {
      interaction: "bonus-key-vendor",
      priceBonusCoins: 3,
    },
    lock: {
      deathCountdownSeconds: 60,
    },
  },
};

export interface AdventureSessionPlan extends AdventureProfilePlan {
  levelId: AdventureLevelId;
  entityPatches: readonly AdventureEntityFieldPatch[];
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
  policy: AdventureRuntimePolicy = DEFAULT_ADVENTURE_RUNTIME_POLICY,
): AdventureSessionPlan {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  return {
    levelId: parsed.id,
    ...planAdventureProfile(save),
    entityPatches:
      parsed.kind === "bonus" ? bonusEntityPatches(policy.bonus) : [],
  };
}

function bonusEntityPatches(
  policy: AdventureBonusRuntimePolicy,
): AdventureEntityFieldPatch[] {
  return [
    {
      type: EntityTypeId.BEAVER,
      fields: {
        interaction: policy.temporaryKeyVendor.interaction,
        temporaryKeyPriceBonusCoins:
          policy.temporaryKeyVendor.priceBonusCoins,
      },
    },
    {
      type: EntityTypeId.LOCK,
      fields: {
        deathCountdownSeconds: policy.lock.deathCountdownSeconds,
      },
    },
  ];
}
