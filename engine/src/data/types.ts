export type TerrainType =
  | 'snow' | 'water' | 'water-animated' | 'tide-up' | 'tide-down' | 'tide-left' | 'tide-right'
  | 'water-variant-1' | 'water-variant-2' | 'water-variant-3'
  | 'ground-a' | 'ground-b' | 'ground-c' | 'ground-d' | 'shovel-cleared-ground'
  | 'ice' | 'start' | 'exit'
  | 'shop-dream' | 'shop-cloud9' | 'shop-super-key' | 'shop-stereo' | 'shop-music' | 'shop-speed-shoes' | 'shop-coin-radar' | 'shop-unavailable'
  | 'shovel-pickup' | 'mower-parking'
  | 'speed-switch-pressed' | 'speed-switch-raised'
  | 'carousel-switch-raised' | 'carousel-switch-pressed'
  | 'tide-switch-raised' | 'tide-switch-pressed'
  | 'wind-switch-0-on' | 'wind-switch-0-off' | 'wind-switch-1-on' | 'wind-switch-1-off'
  | 'wind-switch-2-on' | 'wind-switch-2-off' | 'wind-switch-3-on' | 'wind-switch-3-off'
  | 'trap-active' | 'trap-inactive'
  | 'mirror-1' | 'mirror-2' | 'mirror-3' | 'mirror-4'
  | 'speed-up' | 'speed-down' | 'speed-left' | 'speed-right'
  | 'carousel-1' | 'carousel-2' | 'carousel-3' | 'carousel-4' | 'carousel-vertical' | 'carousel-horizontal'
  | 'color-yellow-switch-raised' | 'color-yellow-switch-pressed' | 'color-pink-switch-raised' | 'color-pink-switch-pressed'
  | 'color-yellow-block-raised' | 'color-yellow-block-lowered' | 'color-pink-block-raised' | 'color-pink-block-lowered'
  | 'high-grass' | 'high-grass-objective'
  | `terrain-${string}`;

export type ObjectType =
  | 'consumed-carrot' | 'carrot' | 'egg-nest-empty' | 'egg-nest-filled' | 'lock'
  | 'beanstalk-tip' | 'bean' | 'windmill-up' | 'windmill-down' | 'windmill-left' | 'windmill-right'
  | 'plank' | 'plank-crumbling' | 'plank-fragment'
  | 'dragon-head' | 'dragon-body' | 'dragon-tail' | 'sandman' | 'dream-machine' | 'mower' | 'gas'
  | 'beanstalk-mid' | 'bean-field' | 'cloud-red' | 'cloud-purple' | 'cloud-green' | 'ice-block'
  | 'ice-melt-1' | 'ice-melt-2' | 'ice-melt-3' | 'beaver-base' | 'dragon-anim-1' | 'dragon-anim-2'
  | 'sandman-body' | 'dream-machine-body' | 'leaf' | 'crumbly-rock' | 'beanstalk-base' | 'bean-sprout'
  | 'cloud-grid-red' | 'cloud-grid-purple' | 'cloud-grid-green' | 'kite' | 'whirlwind' | 'landing'
  | 'golden-carrot' | 'beaver-body' | 'bonus-coin'
  | 'fence-1' | 'fence-2' | 'fence-3' | 'fence-4' | 'fence-5' | 'fence-6' | 'empty'
  | `object-${string}`;

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
  type: ObjectType;
  x: number;
  y: number;
}

export interface LevelData {
  schemaVersion: 2;
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
  terrainEncoding: 'semantic-row-major';
  terrain: TerrainType[][];
  objects: LevelObject[];
}

export interface CatalogLevel {
  id: string;
  canonicalId: string;
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
  primaryArt: { edition: string; tileSize: number; basePath: string; };
  music: { basePath: string; format: string; files: string[]; };
  releases: CatalogRelease[];
  chapters: CatalogChapter[];
  levels: CatalogLevel[];
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}
