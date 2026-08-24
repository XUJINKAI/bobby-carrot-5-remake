import { CHAPTER_COUNT, campaignSequenceForChapter, chapterGroup, parseAdventureLevelId, type AdventureLevelId } from './campaign.js';

export interface AdventureSave {
  schemaVersion: 1;
  game: 'bc5r';
  campaign: {
    completedLevels: AdventureLevelId[];
    completedEvents: string[];
    unlockedChapters: number[];
  };
  economy: {
    bonusCoins: number;
    goldenCarrots: number;
  };
  upgrades: {
    speedShoes: boolean;
    magnifyingGlass: boolean;
    goldenKey: boolean;
  };
  claimedRewards: string[];
}

export function createAdventureSave(): AdventureSave {
  return {
    schemaVersion: 1,
    game: 'bc5r',
    campaign: { completedLevels: [], completedEvents: [], unlockedChapters: initialUnlockedChapters() },
    economy: { bonusCoins: 0, goldenCarrots: 0 },
    upgrades: { speedShoes: false, magnifyingGlass: false, goldenKey: false },
    claimedRewards: []
  };
}

export function parseAdventureSave(text: string): AdventureSave {
  return normalizeAdventureSave(JSON.parse(text) as unknown);
}

export function serializeAdventureSave(save: AdventureSave): string {
  return `${JSON.stringify(normalizeAdventureSave(save), null, 2)}\n`;
}

export function normalizeAdventureSave(value: unknown): AdventureSave {
  if (!value || typeof value !== 'object') throw new Error('存档必须是 JSON object');
  const raw = value as Record<string, unknown>;
  if (raw.game !== undefined && raw.game !== 'bc5r') throw new Error('这不是 bc5r 存档');
  if (raw.schemaVersion !== undefined && raw.schemaVersion !== 1) throw new Error(`不支持的存档版本：${String(raw.schemaVersion)}`);
  const campaign = objectValue(raw.campaign);
  const economy = objectValue(raw.economy);
  const upgrades = objectValue(raw.upgrades);
  const completedLevels = stringArray(campaign.completedLevels)
    .map((id) => parseAdventureLevelId(id)?.id)
    .filter((id): id is AdventureLevelId => Boolean(id));
  const unlockedChapters = numberArray(campaign.unlockedChapters).filter((chapter) => chapter >= 1 && chapter <= CHAPTER_COUNT);
  for (const chapter of initialUnlockedChapters()) if (!unlockedChapters.includes(chapter)) unlockedChapters.push(chapter);
  return {
    schemaVersion: 1,
    game: 'bc5r',
    campaign: {
      completedLevels: unique(completedLevels).sort(compareLevelIds),
      completedEvents: unique(stringArray(campaign.completedEvents)).sort(),
      unlockedChapters: unique(unlockedChapters).sort((a, b) => a - b)
    },
    economy: {
      bonusCoins: nonNegativeInteger(economy.bonusCoins),
      goldenCarrots: nonNegativeInteger(economy.goldenCarrots)
    },
    upgrades: {
      speedShoes: upgrades.speedShoes === true,
      magnifyingGlass: upgrades.magnifyingGlass === true,
      goldenKey: upgrades.goldenKey === true
    },
    claimedRewards: unique(stringArray(raw.claimedRewards)).sort()
  };
}

export function isAdventureLevelCompleted(save: AdventureSave, levelId: string): boolean {
  const parsed = parseAdventureLevelId(levelId);
  return parsed !== null && save.campaign.completedLevels.includes(parsed.id);
}

export function isAdventureLevelUnlocked(save: AdventureSave, levelId: string): boolean {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed || !save.campaign.unlockedChapters.includes(parsed.chapter)) return false;
  const sequence = campaignSequenceForChapter(parsed.chapter);
  const index = sequence.indexOf(parsed.id);
  if (index <= 0) return index === 0;
  return save.campaign.completedLevels.includes(sequence[index - 1]!);
}

export function completeAdventureLevel(save: AdventureSave, levelId: string): AdventureSave {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  const next = structuredClone(normalizeAdventureSave(save));
  if (!next.campaign.completedLevels.includes(parsed.id)) next.campaign.completedLevels.push(parsed.id);
  const sequence = campaignSequenceForChapter(parsed.chapter);
  if (sequence.at(-1) === parsed.id) {
    const group = chapterGroup(parsed.chapter);
    if (parsed.chapter === group[0]) for (const chapter of group) if (!next.campaign.unlockedChapters.includes(chapter)) next.campaign.unlockedChapters.push(chapter);
  }
  return normalizeAdventureSave(next);
}

export function unlockAdventureChapter(save: AdventureSave, chapter: number): AdventureSave {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTER_COUNT) throw new Error(`无效章节：${chapter}`);
  const next = structuredClone(normalizeAdventureSave(save));
  if (!next.campaign.unlockedChapters.includes(chapter)) next.campaign.unlockedChapters.push(chapter);
  return normalizeAdventureSave(next);
}

export function completeAdventureEvent(save: AdventureSave, eventId: string): AdventureSave {
  const id = eventId.trim();
  if (!id) throw new Error('Event ID 不能为空');
  const next = structuredClone(normalizeAdventureSave(save));
  if (!next.campaign.completedEvents.includes(id)) next.campaign.completedEvents.push(id);
  return normalizeAdventureSave(next);
}

function initialUnlockedChapters(): number[] {
  const chapters: number[] = [];
  for (let chapter = 1; chapter <= CHAPTER_COUNT; chapter += 4) chapters.push(chapter);
  return chapters;
}
function objectValue(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean) : []; }
function numberArray(value: unknown): number[] { return Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : []; }
function nonNegativeInteger(value: unknown): number { const number = Number(value ?? 0); return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0; }
function unique<T>(values: T[]): T[] { return [...new Set(values)]; }
function compareLevelIds(a: AdventureLevelId, b: AdventureLevelId): number { const pa = parseAdventureLevelId(a)!, pb = parseAdventureLevelId(b)!; if (pa.chapter !== pb.chapter) return pa.chapter - pb.chapter; return campaignSequenceForChapter(pa.chapter).indexOf(a) - campaignSequenceForChapter(pb.chapter).indexOf(b); }
