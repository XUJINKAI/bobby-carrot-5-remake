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
  level: 'tutorial' | 'easy' | 'medium' | 'hard';
  source: 'historical' | 'estimated';
  label: string;
  collections?: string[];
  confidence?: number;
}

export interface LevelObject {
  id: number;
  signedId: number;
  hexId: string;
  x: number;
  y: number;
}

export interface LevelData {
  schemaVersion: number;
  id?: string;
  canonicalId?: string;
  publicId?: string;
  release?: string;
  chapter?: number;
  chapterTitle?: string;
  chapterLevel?: number;
  difficulty?: DifficultyInfo;
  source: LevelSource;
  sources?: LevelSource[];
  recordLength: number;
  recordSha256: string;
  width: number;
  height: number;
  dynamicSlots: number;
  terrainEncoding: string;
  terrain: number[][];
  objects: LevelObject[];
}

export interface CatalogLevel {
  /** 旧 canonical ID（001...485），仅内部去重/兼容使用。 */
  id: string;
  canonicalId: string;
  /** 玩家可见 ID，例如 base-1-1、up9-4-12。 */
  publicId: string;
  number: number;
  release: string;
  releaseSourceId: string;
  releaseLabel: string;
  chapter: number;
  chapterTitle: string;
  chapterDescription: string;
  chapterLevel: number;
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
  release: string;
  releaseSourceId: string;
  releaseLabel: string;
  chapter: number;
  title: string;
  description: string;
  levelPublicIds: string[];
}

export interface CatalogRelease {
  id: string;
  sourceId: string;
  order: number;
  label: string;
  中文名: string;
  levelCount: number;
  chapters: string[];
}

export interface LevelCatalog {
  schemaVersion: number;
  totalSourceLevels: number;
  uniqueLevels: number;
  duplicateSourceRecords: number;
  primaryArt: {
    edition: string;
    tileSize: number;
    basePath: string;
  };
  music: {
    basePath: string;
    format: string;
    files: string[];
  };
  releases: CatalogRelease[];
  chapters: CatalogChapter[];
  levels: CatalogLevel[];
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}
