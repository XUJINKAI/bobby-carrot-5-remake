import {
  CHAPTER_COUNT,
  campaignSequenceForChapter,
  parseAdventureLevelId,
  type AdventureLevelId,
} from "./campaign.js";

export const ADVENTURE_ITEM_IDS = [
  "golden-key",
  "speed-shoes",
  "coin-radar",
  "stereo",
  "night-train-map-1",
  "night-train-map-2",
] as const;
export type AdventureItemId = (typeof ADVENTURE_ITEM_IDS)[number];

export interface AdventureSave {
  schemaVersion: 1;
  game: "bc5r";
  campaign: {
    completedLevels: AdventureLevelId[];
    completedEvents: string[];
    resumeLevelId: AdventureLevelId;
  };
  economy: {
    bonusCoins: number;
    goldenCarrots: number;
  };
  items: AdventureItemId[];
}

export function createAdventureSave(): AdventureSave {
  return {
    schemaVersion: 1,
    game: "bc5r",
    campaign: {
      completedLevels: [],
      completedEvents: [],
      resumeLevelId: "1-1",
    },
    economy: { bonusCoins: 0, goldenCarrots: 0 },
    items: [],
  };
}

export function parseAdventureSave(text: string): AdventureSave {
  return normalizeAdventureSave(JSON.parse(text) as unknown);
}

export function serializeAdventureSave(save: AdventureSave): string {
  return `${JSON.stringify(normalizeAdventureSave(save), null, 2)}\n`;
}

export function normalizeAdventureSave(value: unknown): AdventureSave {
  if (!value || typeof value !== "object")
    throw new Error("存档必须是 JSON object");
  const raw = value as Record<string, unknown>;
  if (raw.game !== "bc5r") throw new Error("这不是 bc5r 存档");
  if (raw.schemaVersion !== 1)
    throw new Error(`不支持的存档版本：${String(raw.schemaVersion)}`);
  const campaign = objectValue(raw.campaign);
  const economy = objectValue(raw.economy);
  const completedLevels = stringArray(campaign.completedLevels)
    .map((id) => parseAdventureLevelId(id)?.id)
    .filter((id): id is AdventureLevelId => Boolean(id));
  const parsedResume = parseAdventureLevelId(String(campaign.resumeLevelId ?? ""));
  const items = stringArray(raw.items).filter(isAdventureItemId);
  return {
    schemaVersion: 1,
    game: "bc5r",
    campaign: {
      completedLevels: unique(completedLevels).sort(compareLevelIds),
      completedEvents: unique(stringArray(campaign.completedEvents)).sort(),
      resumeLevelId: parsedResume?.id ?? "1-1",
    },
    economy: {
      bonusCoins: nonNegativeInteger(economy.bonusCoins),
      goldenCarrots: nonNegativeInteger(economy.goldenCarrots),
    },
    items: unique(items).sort(),
  };
}

export function isAdventureLevelCompleted(
  save: AdventureSave,
  levelId: string,
): boolean {
  const parsed = parseAdventureLevelId(levelId);
  return parsed !== null && save.campaign.completedLevels.includes(parsed.id);
}

export function isAdventureLevelUnlocked(
  save: AdventureSave,
  levelId: string,
): boolean {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) return false;
  const sequence = campaignSequenceForChapter(parsed.chapter);
  const index = sequence.indexOf(parsed.id);
  if (index <= 0) return index === 0;
  return save.campaign.completedLevels.includes(sequence[index - 1]!);
}

export function isAdventureChapterCompleted(
  save: AdventureSave,
  chapter: number,
): boolean {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTER_COUNT)
    return false;
  return campaignSequenceForChapter(chapter).every((id) =>
    save.campaign.completedLevels.includes(id),
  );
}

export function setAdventureResumeLevel(
  save: AdventureSave,
  levelId: string,
): AdventureSave {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  const next = structuredClone(normalizeAdventureSave(save));
  if (!next.campaign.completedLevels.includes(parsed.id))
    next.campaign.resumeLevelId = parsed.id;
  return normalizeAdventureSave(next);
}

export function completeAdventureLevel(
  save: AdventureSave,
  levelId: string,
): AdventureSave {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  const next = structuredClone(normalizeAdventureSave(save));
  const alreadyCompleted = next.campaign.completedLevels.includes(parsed.id);
  if (!alreadyCompleted) next.campaign.completedLevels.push(parsed.id);
  if (!alreadyCompleted && next.campaign.resumeLevelId === parsed.id) {
    const following = nextAdventureLevelId(parsed.id);
    if (following) next.campaign.resumeLevelId = following;
  }
  return normalizeAdventureSave(next);
}

export function completeAdventureEvent(
  save: AdventureSave,
  eventId: string,
): AdventureSave {
  const id = eventId.trim();
  if (!id) throw new Error("Event ID 不能为空");
  const next = structuredClone(normalizeAdventureSave(save));
  if (!next.campaign.completedEvents.includes(id))
    next.campaign.completedEvents.push(id);
  return normalizeAdventureSave(next);
}

export function hasAdventureItem(
  save: AdventureSave,
  item: AdventureItemId,
): boolean {
  return normalizeAdventureSave(save).items.includes(item);
}

export function grantAdventureItem(
  save: AdventureSave,
  item: AdventureItemId,
): AdventureSave {
  const next = structuredClone(normalizeAdventureSave(save));
  if (!next.items.includes(item)) next.items.push(item);
  return normalizeAdventureSave(next);
}

function nextAdventureLevelId(current: AdventureLevelId): AdventureLevelId | null {
  const parsed = parseAdventureLevelId(current)!;
  const sequence = campaignSequenceForChapter(parsed.chapter);
  const index = sequence.indexOf(parsed.id);
  const sameChapter = sequence[index + 1];
  if (sameChapter) return sameChapter;
  if (parsed.chapter >= CHAPTER_COUNT) return null;
  return campaignSequenceForChapter(parsed.chapter + 1)[0] ?? null;
}

function isAdventureItemId(value: string): value is AdventureItemId {
  return (ADVENTURE_ITEM_IDS as readonly string[]).includes(value);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}
function nonNegativeInteger(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}
function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
function compareLevelIds(a: AdventureLevelId, b: AdventureLevelId): number {
  const pa = parseAdventureLevelId(a)!,
    pb = parseAdventureLevelId(b)!;
  if (pa.chapter !== pb.chapter) return pa.chapter - pb.chapter;
  return (
    campaignSequenceForChapter(pa.chapter).indexOf(a) -
    campaignSequenceForChapter(pb.chapter).indexOf(b)
  );
}
