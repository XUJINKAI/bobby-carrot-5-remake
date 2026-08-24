import { isBonusLevelId, parseAdventureLevelId, type AdventureLevelId } from './campaign.js';
import { normalizeAdventureSave, type AdventureSave } from './save.js';

export type AdventureViewportPolicy = 'original-portrait';

export interface AdventureCapabilities {
  speedShoes: boolean;
  magnifyingGlass: boolean;
  goldenKey: boolean;
}

export interface AdventureSessionPlan {
  levelId: AdventureLevelId;
  viewportPolicy: AdventureViewportPolicy;
  timedChallengeMs: number | null;
  capabilities: AdventureCapabilities;
}

export function planAdventureSession(levelId: string, save: AdventureSave): AdventureSessionPlan {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  const normalized = normalizeAdventureSave(save);
  return {
    levelId: parsed.id,
    viewportPolicy: 'original-portrait',
    timedChallengeMs: isBonusLevelId(parsed.id) ? 60_000 : null,
    capabilities: {
      speedShoes: normalized.upgrades.speedShoes,
      magnifyingGlass: normalized.upgrades.magnifyingGlass,
      goldenKey: normalized.upgrades.goldenKey
    }
  };
}
