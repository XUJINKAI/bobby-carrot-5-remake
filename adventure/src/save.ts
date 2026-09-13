import { BC5R_GAME_ID } from "@bobby/model";
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

/** 需要持久化的一次性 Adventure 事件；只接受这里明确登记的 ID。 */
export const ADVENTURE_EVENT_IDS = ["bonus-key-trial"] as const;
export type AdventureEventId = (typeof ADVENTURE_EVENT_IDS)[number];

export interface AdventureSave {
  schemaVersion: 1;
  /** 随存档保存的项目来源标识。 */
  game: typeof BC5R_GAME_ID;
  campaign: {
    /** 每章只保存按顺序完成到的最远关卡。 */
    completedThrough: Record<string, AdventureLevelId>;
    completedEvents: AdventureEventId[];
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
    game: BC5R_GAME_ID,
    campaign: {
      completedThrough: {},
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
  if (raw.game !== BC5R_GAME_ID) throw new Error("这不是 Bobby Carrot 5 Remake 存档");
  if (raw.schemaVersion !== 1)
    throw new Error(`不支持的存档版本：${String(raw.schemaVersion)}`);
  const campaign = objectValue(raw.campaign);
  const economy = objectValue(raw.economy);
  const completedThrough = normalizeCompletedThrough(campaign.completedThrough);
  const completedEvents = stringArray(campaign.completedEvents).filter(isAdventureEventId);
  const parsedResume = parseAdventureLevelId(String(campaign.resumeLevelId ?? ""));
  const items = stringArray(raw.items).filter(isAdventureItemId);
  return {
    schemaVersion: 1,
    game: BC5R_GAME_ID,
    campaign: {
      completedThrough,
      completedEvents: unique(completedEvents).sort(),
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
  if (!parsed) return false;
  const sequence = campaignSequenceForChapter(parsed.chapter);
  const completed = save.campaign.completedThrough[String(parsed.chapter)];
  return completed !== undefined &&
    sequence.indexOf(parsed.id) <= sequence.indexOf(completed);
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
  return isAdventureLevelCompleted(save, sequence[index - 1]!);
}

export function isAdventureChapterCompleted(
  save: AdventureSave,
  chapter: number,
): boolean {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTER_COUNT)
    return false;
  const sequence = campaignSequenceForChapter(chapter);
  return save.campaign.completedThrough[String(chapter)] === sequence.at(-1);
}

export function completedAdventureLevelCount(save: AdventureSave): number {
  const normalized = normalizeAdventureSave(save);
  return Object.entries(normalized.campaign.completedThrough).reduce(
    (total, [chapter, completed]) => {
      const sequence = campaignSequenceForChapter(Number(chapter));
      return total + sequence.indexOf(completed) + 1;
    },
    0,
  );
}

export function setAdventureResumeLevel(
  save: AdventureSave,
  levelId: string,
): AdventureSave {
  const parsed = parseAdventureLevelId(levelId);
  if (!parsed) throw new Error(`不是 Adventure 关卡 ID：${levelId}`);
  const next = structuredClone(normalizeAdventureSave(save));
  if (!isAdventureLevelCompleted(next, parsed.id))
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
  const alreadyCompleted = isAdventureLevelCompleted(next, parsed.id);
  if (!alreadyCompleted && !isAdventureLevelUnlocked(next, parsed.id))
    throw new Error(`Adventure 关卡尚未解锁：${parsed.id}`);
  if (!alreadyCompleted)
    next.campaign.completedThrough[String(parsed.chapter)] = parsed.id;
  if (!alreadyCompleted && next.campaign.resumeLevelId === parsed.id) {
    const following = nextAdventureLevelId(parsed.id);
    if (following) next.campaign.resumeLevelId = following;
  }
  return normalizeAdventureSave(next);
}

export function completeAdventureEvent(
  save: AdventureSave,
  eventId: AdventureEventId,
): AdventureSave {
  const next = structuredClone(normalizeAdventureSave(save));
  if (!next.campaign.completedEvents.includes(eventId))
    next.campaign.completedEvents.push(eventId);
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

function isAdventureEventId(value: string): value is AdventureEventId {
  return (ADVENTURE_EVENT_IDS as readonly string[]).includes(value);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeCompletedThrough(value: unknown): Record<string, AdventureLevelId> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Adventure Save campaign.completedThrough 必须为 object");
  const source = value as Record<string, unknown>;
  const result: Record<string, AdventureLevelId> = {};
  for (let chapter = 1; chapter <= CHAPTER_COUNT; chapter += 1) {
    const key = String(chapter);
    const raw = source[key];
    if (raw === undefined) continue;
    const parsed = typeof raw === "string" ? parseAdventureLevelId(raw) : null;
    if (!parsed || parsed.chapter !== chapter)
      throw new Error(`Adventure Save campaign.completedThrough.${key} 无效`);
    result[key] = parsed.id;
  }
  const unknown = Object.keys(source).find(
    (key) => !Object.prototype.hasOwnProperty.call(result, key),
  );
  if (unknown !== undefined)
    throw new Error(`Adventure Save campaign.completedThrough 章节无效：${unknown}`);
  return result;
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
