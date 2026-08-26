import type { LevelMap } from "@bobby/model";
import type {
  AdventureLevelId,
  AdventureSpecialSceneId,
  ChapterDifficultyStars,
} from "@bobby/adventure";

export interface MapMeta {
  id: string;
  name: string;
  description?: string;
  author?: string;
  next?: string;
  music?: string;
}

export interface MapDocument extends LevelMap {
  schemaVersion: 1;
  meta: MapMeta;
}

export type MapCollectionIcon =
  | { type: "terrain"; id: string }
  | { type: "object"; id: string }
  | { type: "image"; src: string }
  | { type: "text"; value: string };

export interface MapCollectionFilterOption {
  id: string;
  name: string;
  icon?: MapCollectionIcon;
}

export interface MapCollectionFilter {
  id: string;
  name: string;
  options: MapCollectionFilterOption[];
}

export interface MapCollectionChapter {
  id: string;
  name: string;
  description: string;
  difficulty?: number;
}

export interface MapCollectionMap {
  id: string;
  name: string;
  description: string;
  chapter?: string;
  kind?: string;
  filters?: Record<string, string[]>;
}

export interface MapCollectionIndex {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  filters: MapCollectionFilter[];
  chapters: MapCollectionChapter[];
  maps: MapCollectionMap[];
}

export interface AdventureIndexLevel {
  id: string;
  map: string;
}

export interface AdventureIndexChapter {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  levels: AdventureIndexLevel[];
}

export interface AdventureIndexSpecialScene {
  id: string;
  name: string;
  map: string;
}

export interface AdventureIndex {
  schemaVersion: 1;
  name: string;
  chapters: AdventureIndexChapter[];
  specialScenes: AdventureIndexSpecialScene[];
}

export function levelMapFromDocument(document: MapDocument): LevelMap {
  return {
    width: document.width,
    height: document.height,
    terrain: document.terrain,
    objects: document.objects,
    ...(document.rules ? { rules: document.rules } : {}),
  };
}

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

export interface OfficialLevelData extends LevelMap {
  schemaVersion: 3;
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
  sources: LevelSource[];
  path: string;
  carrotCount: number;
  specialItems: string[];
  scenes: string[];
  mechanics: string[];
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

export interface MapCollectionSummary {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface MapCollectionsIndex {
  schemaVersion: 1;
  collections: MapCollectionSummary[];
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}
