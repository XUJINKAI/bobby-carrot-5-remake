import {
  parseAdventureLevelId,
  type AdventureLevelId,
} from "./campaign.js";
import {
  hasAdventureItem,
  normalizeAdventureSave,
  type AdventureSave,
} from "./save.js";

export interface AdventurePlayerPlan {
  bobbyMoveMs: number;
}

export interface AdventureRuntimePolicy {
  locomotion: {
    normalMoveMs: number;
    speedShoesMoveMs: number;
  };
}

export const DEFAULT_ADVENTURE_RUNTIME_POLICY: AdventureRuntimePolicy = {
  locomotion: {
    normalMoveMs: 350,
    speedShoesMoveMs: 266,
  },
};

export interface AdventureSessionPlan extends AdventurePlayerPlan {
  levelId: AdventureLevelId;
  /** 永久钥匙在 Bonus Session 中投影为一枚关卡内钥匙。 */
  initialLockKeys: 0 | 1;
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
    initialLockKeys:
      parsed.kind === "bonus" && hasAdventureItem(save, "golden-key") ? 1 : 0,
  };
}
