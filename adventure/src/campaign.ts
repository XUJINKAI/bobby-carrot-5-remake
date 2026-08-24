export type ChapterDifficultyStars = 1 | 2 | 3;
export type BonusOrdinal = 1 | 2;
export type AdventureLevelId = `${number}-${number}` | `${number}-bonus-${BonusOrdinal}`;
export type AdventureSpecialSceneId = 'beaver-shop' | 'cloud-9' | 'dream-machine' | 'dreamland-reward' | 'campaign-intro';
export type AdventureContentId = AdventureLevelId | AdventureSpecialSceneId;

export const CHAPTER_COUNT = 40;
export const CHAPTER_SOURCE_SEQUENCE = [1, 2, 3, 11, 4, 5, 6, 12, 7, 8, 9, 10] as const;

export const SPECIAL_SCENE_BY_SOURCE_INDEX: Readonly<Record<number, AdventureSpecialSceneId>> = Object.freeze({
  1: 'beaver-shop',
  2: 'cloud-9',
  3: 'dream-machine',
  4: 'dreamland-reward',
  5: 'campaign-intro'
});

export interface ParsedAdventureLevelId {
  id: AdventureLevelId;
  chapter: number;
  kind: 'main' | 'bonus';
  mainLevel: number | null;
  bonus: BonusOrdinal | null;
}

export function adventureChapterNumber(releaseOrder: number, packFile: string | number): number {
  const localChapter = Number(packFile);
  if (!Number.isInteger(releaseOrder) || releaseOrder < 0 || !Number.isInteger(localChapter) || localChapter < 1 || localChapter > 4) {
    throw new Error(`Invalid original chapter source: releaseOrder=${releaseOrder}, packFile=${String(packFile)}`);
  }
  const chapter = releaseOrder * 4 + localChapter;
  if (chapter < 1 || chapter > CHAPTER_COUNT) throw new Error(`Adventure chapter is out of range: ${chapter}`);
  return chapter;
}

export function adventureLevelIdForSource(releaseOrder: number, packFile: string | number, sourceLevelIndex: number): AdventureLevelId {
  const chapter = adventureChapterNumber(releaseOrder, packFile);
  if (!Number.isInteger(sourceLevelIndex) || sourceLevelIndex < 1 || sourceLevelIndex > 12) throw new Error(`Invalid original level index: ${sourceLevelIndex}`);
  if (sourceLevelIndex === 11) return `${chapter}-bonus-1`;
  if (sourceLevelIndex === 12) return `${chapter}-bonus-2`;
  return `${chapter}-${sourceLevelIndex}`;
}

export function specialSceneIdForSource(sourceLevelIndex: number): AdventureSpecialSceneId {
  const scene = SPECIAL_SCENE_BY_SOURCE_INDEX[sourceLevelIndex];
  if (!scene) throw new Error(`Unknown 00.dat special scene index: ${sourceLevelIndex}`);
  return scene;
}

export function campaignSequenceForChapter(chapter: number): AdventureLevelId[] {
  assertChapter(chapter);
  return CHAPTER_SOURCE_SEQUENCE.map((sourceIndex) => adventureLevelIdForSource(Math.floor((chapter - 1) / 4), ((chapter - 1) % 4) + 1, sourceIndex));
}

export function parseAdventureLevelId(value: string): ParsedAdventureLevelId | null {
  const normalized = value.trim().toLowerCase();
  const bonus = /^(\d+)-bonus-([12])$/.exec(normalized);
  if (bonus) {
    const chapter = Number(bonus[1]);
    if (chapter < 1 || chapter > CHAPTER_COUNT) return null;
    const ordinal = Number(bonus[2]) as BonusOrdinal;
    return { id: `${chapter}-bonus-${ordinal}`, chapter, kind: 'bonus', mainLevel: null, bonus: ordinal };
  }
  const main = /^(\d+)-(10|[1-9])$/.exec(normalized);
  if (!main) return null;
  const chapter = Number(main[1]);
  const mainLevel = Number(main[2]);
  if (chapter < 1 || chapter > CHAPTER_COUNT) return null;
  return { id: `${chapter}-${mainLevel}`, chapter, kind: 'main', mainLevel, bonus: null };
}

export function isAdventureLevelId(value: string): value is AdventureLevelId {
  return parseAdventureLevelId(value) !== null;
}

export function isBonusLevelId(value: string): boolean {
  return parseAdventureLevelId(value)?.kind === 'bonus';
}

export function sourceLevelIndexForAdventureId(value: string): number | null {
  const parsed = parseAdventureLevelId(value);
  if (!parsed) return null;
  if (parsed.kind === 'bonus') return parsed.bonus === 1 ? 11 : 12;
  return parsed.mainLevel;
}

export function chapterGroup(chapter: number): readonly [number, number, number, number] {
  assertChapter(chapter);
  const first = Math.floor((chapter - 1) / 4) * 4 + 1;
  return [first, first + 1, first + 2, first + 3];
}

function assertChapter(chapter: number): void {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTER_COUNT) throw new Error(`Invalid Adventure chapter: ${chapter}`);
}
