import type { LevelMap } from "@bobby/model";

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

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}
