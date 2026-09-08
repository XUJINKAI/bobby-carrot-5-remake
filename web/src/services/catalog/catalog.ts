import type { LevelMap, MapDocument } from "@bobby/model";
export type {
  MapCollectionCardSize,
  MapCollectionChapter,
  MapCollectionEntityIcon,
  MapCollectionFilter,
  MapCollectionFilterOption,
  MapCollectionIcon,
  MapCollectionIndex,
  MapCollectionMap,
  MapCollectionSummary,
  MapCollectionsIndex,
  MapDocument,
  MapMeta,
} from "@bobby/model";

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
    schemaVersion: 1,
    width: document.width,
    height: document.height,
    entities: structuredClone(document.entities),
    ...(document.music !== undefined ? { music: document.music } : {}),
    ...(document.note !== undefined ? { note: document.note } : {}),
    ...(document.rules ? { rules: structuredClone(document.rules) } : {}),
  };
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
