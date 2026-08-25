import type { LevelMap } from "@bobby/model";
import type {
  AdventureLevelId,
  AdventureSpecialSceneId,
  ChapterDifficultyStars,
} from "@bobby/adventure";

export interface LevelSource {
  edition: string;
  release?: string;
  releaseLabel?: string;
  packFile: string;
  packTitle?: string;
  packDescription?: string;
  levelIndex: number;
  decodedPath?: string;
}

export interface DifficultyInfo {
  level: "tutorial" | "easy" | "medium" | "hard";
  source: "historical" | "estimated";
  label: string;
  collections?: string[];
  confidence?: number;
}

export interface OfficialLevelData extends LevelMap {
  schemaVersion: 2;
  id?: string;
  canonicalId?: string;
  publicId?: AdventureLevelId | AdventureSpecialSceneId;
  contentKind?: "level" | "bonus" | "special-scene";
  release?: string;
  chapter?: number;
  chapterTitle?: string;
  chapterLevel?: number;
  sourceLevelIndex?: number;
  bonusOrdinal?: 1 | 2 | null;
  difficulty?: DifficultyInfo;
  source: LevelSource;
  sources?: LevelSource[];
  recordLength: number;
  recordSha256: string;
  dynamicSlots: number;
  terrainEncoding: "semantic-row-major";
}

export interface CatalogLevel {
  id: string;
  canonicalId: string;
  publicId: AdventureLevelId;
  contentKind: "level" | "bonus";
  number: number;
  release: string;
  releaseSourceId: string;
  releaseLabel: string;
  chapter: number;
  chapterTitle: string;
  chapterDescription: string;
  chapterLevel: number;
  sourceLevelIndex: number;
  bonusOrdinal: 1 | 2 | null;
  recordSha256: string;
  width: number;
  height: number;
  dynamicSlots: number;
  objectCount: number;
  difficulty: DifficultyInfo;
  sources: LevelSource[];
  path: string;
}

export interface CatalogChapter {
  id: string;
  number: number;
  title: string;
  description: string;
  difficultyStars: ChapterDifficultyStars;
  levelPublicIds: AdventureLevelId[];
  source: {
    release: string;
    releaseLabel: string;
    packFile: string;
    packType: ChapterDifficultyStars;
  };
}

export interface CatalogSpecialScene {
  id: AdventureSpecialSceneId;
  publicId: AdventureSpecialSceneId;
  contentKind: "special-scene";
  canonicalId: string;
  sourceLevelIndex: number;
  label: string;
  path: string;
  primarySource: LevelSource;
  sources: LevelSource[];
}

export interface SourceRelease {
  id: string;
  sourceId?: string;
  order: number;
  label: string;
  中文名: string;
  levelCount: number;
  chapters: string[];
}

export interface LevelCatalog {
  schemaVersion: 4;
  totalSourceLevels: number;
  uniqueMaps: number;
  uniqueLevels: number;
  specialSceneCount: number;
  duplicateSourceRecords: number;
  primaryArt: { edition: string; tileSize: number; basePath: string };
  music: { basePath: string; format: string; files: string[] };
  sourceReleases: SourceRelease[];
  chapters: CatalogChapter[];
  specialScenes: CatalogSpecialScene[];
  levels: CatalogLevel[];
  campaign: {
    chapterCount: number;
    mainLevelsPerChapter: number;
    bonusLevelsPerChapter: number;
    levelCount: number;
    specialSceneCount: number;
    order: string;
  };
  difficulty: { historicalNonTutorialLevels: number; estimatedLevels: number };
}

export interface CustomMapCatalogEntry {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface CustomMapCollection {
  id: string;
  name: string;
  description: string;
  order: number;
  maps: CustomMapCatalogEntry[];
}

export interface CustomMapCatalog {
  schemaVersion: 1;
  collections: CustomMapCollection[];
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}
