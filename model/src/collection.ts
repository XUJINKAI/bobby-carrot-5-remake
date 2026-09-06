import type { EntityType, JsonPrimitive } from "./types.js";

/** Entity-based collection icon. Entity-specific fields use the same flat Entity Map ABI. */
export interface MapCollectionEntityIcon {
  type: EntityType;
  [key: string]: JsonPrimitive;
}

export type MapCollectionIcon =
  | { type: "entity"; entity: MapCollectionEntityIcon }
  | { type: "image"; src: string }
  | { type: "text"; value: string };

export type MapCollectionCardSize = "small" | "medium" | "big";

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
  description?: string;
  difficulty?: number;
}

/** Runtime collection entry. Original-specific kind/filters remain optional extensions. */
export interface MapCollectionMap {
  id: string;
  name: string;
  description?: string;
  chapter?: string;
  kind?: string;
  filters?: Record<string, string[]>;
}

/**
 * assets/maps/<collection>/index.json
 * Collection identity comes from the resource path and is deliberately not repeated here.
 */
export interface MapCollectionIndex {
  schemaVersion: 1;
  name: string;
  description?: string;
  cardSize: MapCollectionCardSize;
  filters: MapCollectionFilter[];
  chapters: MapCollectionChapter[];
  maps: MapCollectionMap[];
}

export interface MapCollectionSummary {
  /** Resource/path ID used to resolve assets/maps/<id>/index.json. */
  id: string;
  name: string;
  description?: string;
}

/** assets/maps/index.json. collections[] array order is the display/navigation order. */
export interface MapCollectionsIndex {
  schemaVersion: 1;
  collections: MapCollectionSummary[];
}

/** Optional chapter presentation metadata in hand-maintained custom-maps/collections.json. */
export interface CollectionManifestChapter {
  name?: string;
  description?: string;
}

/**
 * One hand-maintained collection definition.
 * Membership, chapter ID and map ID come from filesystem paths; this object stores only collection/chapter presentation metadata.
 */
export interface CollectionManifestEntry {
  id: string;
  name: string;
  description?: string;
  cardSize?: MapCollectionCardSize;
  chapters?: Record<string, CollectionManifestChapter>;
}

/** custom-maps/collections.json. collections[] array order is collection order. */
export interface CollectionManifest {
  schemaVersion: 1;
  collections: CollectionManifestEntry[];
}
