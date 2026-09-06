import type { AdventureSave } from "@bobby/adventure";
import type { MapDocument } from "@bobby/model";

/** One Explore collection can be exported/reset independently. */
export interface ExploreCollectionStorage {
  completedMaps: string[];
  lastMap?: string;
}

/** Collection ID -> independent Explore progress. */
export type ExploreStorage = Record<string, ExploreCollectionStorage>;

/** Editor persistence intentionally stores the canonical MapDocument only. */
export interface EditorStorage {
  draft?: MapDocument;
}

/** Full portable backup across the Web product's persisted domains. */
export interface WebStorageSnapshot {
  schemaVersion: 1;
  adventure: AdventureSave;
  explore: ExploreStorage;
  editor: EditorStorage;
}
