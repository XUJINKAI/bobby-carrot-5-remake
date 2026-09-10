import { MapEntityTypeId } from "@bobby/model";
import type { AdventureEntityFieldPatch } from "./augment.js";
import {
  parseAdventureLevelId,
  type AdventureLevelId,
} from "./campaign.js";
import {
  normalizeAdventureSave,
  type AdventureSave,
} from "./save.js";

export interface AdventurePlayerPlan {
  bobbyMoveMs: number;
  reusableLockKey: boolean;
}

/** Adventure policy 在进入 Engine 前落实为扁平的 canonical Map 字段。 */
export interface AdventureBonusRuntimePolicy {
  lock: {
    deathCountdownSeconds: number;
  };
}

export interface AdventureRuntimePolicy {
  locomotion: {
    normalMoveMs: number;
    speedShoesMoveMs: number;
  };
  bonus: AdventureBonusRuntimePolicy;
}

export const DEFAULT_ADVENTURE_RUNTIME_POLICY: AdventureRuntimePolicy = {
  locomotion: {
    normalMoveMs: 350,
    speedShoesMoveMs: 266,
  },
  bonus: {
    lock: {
      deathCountdownSeconds: 60,
    },
  },
};

export interface AdventureSessionPlan extends AdventurePlayerPlan {
  levelId: AdventureLevelId;
  entityPatches: readonly AdventureEntityFieldPatch[];
}

export function planAdventurePlayer(
  save: AdventureSave,
  policy: AdventureRuntimePolicy = DEFAULT_ADVENTURE_RUNTIME_POLICY,
): AdventurePlayerPlan {
  const normalized = normalizeAdventureSave(save);
  return {
    bobbyMoveMs: normalized.items.includes("speed-shoes")
      ? policy.locomotion.speedShoesMoveMs
      : policy.locomotion.normalMoveMs,
    reusableLockKey: normalized.items.includes("golden-key"),
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
    ...planAdventurePlayer(save, policy),
    entityPatches:
      parsed.kind === "bonus" ? bonusEntityPatches(policy.bonus) : [],
  };
}

function bonusEntityPatches(
  policy: AdventureBonusRuntimePolicy,
): AdventureEntityFieldPatch[] {
  return [
    {
      type: MapEntityTypeId.LOCK,
      fields: {
        deathCountdownSeconds: policy.lock.deathCountdownSeconds,
      },
    },
  ];
}
