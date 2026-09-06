import type { AdventureSave } from "@bobby/adventure";
import type { MapDocument } from "@bobby/model";

/** Physical browser-storage namespace. These strings are part of the persisted Web contract. */
export const ADVENTURE_STORAGE_KEY = "bc5r:adventure";
export const EXPLORE_STORAGE_PREFIX = "bc5r:explore/";
export const EDITOR_STORAGE_PREFIX = "bc5r:editor/";
export const EDITOR_AUTOSAVE_SLOT = "autosave";
export const EDITOR_AUTOSAVE_STORAGE_KEY = `${EDITOR_STORAGE_PREFIX}${EDITOR_AUTOSAVE_SLOT}`;

/** One Explore collection is one physical localStorage record: bc5r:explore/<collection>. */
export interface ExploreCollectionStorage {
  schemaVersion: 1;
  completedMaps: string[];
  lastMap?: string;
}

/** Portable/export view only; physical storage remains one key per collection. */
export type ExploreStorageSnapshot = Record<string, ExploreCollectionStorage>;

/**
 * Portable/export view of Editor persistence.
 * Physical storage is bc5r:editor/autosave plus one bc5r:editor/<name> key per named save.
 */
export interface EditorStorageSnapshot {
  autosave?: MapDocument;
  saves: Record<string, MapDocument>;
}

/** Full portable backup across Web persisted domains. This is not itself a localStorage record. */
export interface WebStorageSnapshot {
  schemaVersion: 1;
  adventure: AdventureSave;
  explore: ExploreStorageSnapshot;
  editor: EditorStorageSnapshot;
}

export function exploreStorageKey(collectionId: string): string {
  const id = collectionId.trim();
  if (!id) throw new Error("Explore collection ID cannot be empty");
  return `${EXPLORE_STORAGE_PREFIX}${id}`;
}

/**
 * Named Editor save key. Slot names are URI-encoded so user-facing names may contain spaces/CJK safely.
 * "autosave" is reserved for the working draft and cannot be used as a named save.
 */
export function editorStorageKey(name: string): string {
  const normalized = name.trim();
  if (!normalized) throw new Error("Editor save name cannot be empty");
  if (normalized === EDITOR_AUTOSAVE_SLOT)
    throw new Error(`Editor save name ${JSON.stringify(normalized)} is reserved`);
  return `${EDITOR_STORAGE_PREFIX}${encodeURIComponent(normalized)}`;
}
