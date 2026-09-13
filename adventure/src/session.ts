import {
  MapEntityTypeId,
  type LevelPatch,
} from "@bobby/model";
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
  levelPatches: readonly LevelPatch[];
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
    levelPatches:
      parsed.kind === "bonus"
        ? bonusEntityPatches(
            policy.bonus,
            normalizedAdventureOwnsPermanentKey(save),
          )
        : [],
  };
}

function bonusEntityPatches(
  policy: AdventureBonusRuntimePolicy,
  ownsPermanentKey: boolean,
): LevelPatch[] {
  return [
    {
      operation: "set-fields",
      selector: { type: MapEntityTypeId.LOCK },
      fields: {
        requireKey: !ownsPermanentKey,
        deathCountdownSeconds: policy.lock.deathCountdownSeconds,
      },
    },
  ];
}

function normalizedAdventureOwnsPermanentKey(save: AdventureSave): boolean {
  return normalizeAdventureSave(save).items.includes("golden-key");
}
