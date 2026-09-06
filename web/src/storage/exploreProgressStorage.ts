import { BC5R_GAME_ID } from "@bobby/model";
import {
  EXPLORE_STORAGE_PREFIX,
  exploreStorageKey,
  type ExploreCollectionStorage,
} from "./contracts.js";

/** Portable aggregate exchange only. Physical storage is one key per collection. */
export interface ExploreProgressSave {
  game: typeof BC5R_GAME_ID;
  schemaVersion: 1;
  mode: "explore";
  collections: Record<string, ExploreCollectionStorage>;
}

export function completedExploreMapIds(collection: string): Set<string> {
  return new Set(loadExploreCollectionSave(collection).completedMaps);
}

export function markExploreMapCompleted(collection: string, mapId: string): void {
  const save = loadExploreCollectionSave(collection);
  save.completedMaps = [...new Set([...save.completedMaps, mapId])].sort();
  saveExploreCollectionSave(collection, save);
}

export function lastExploreMapId(collection: string): string | null {
  return loadExploreCollectionSave(collection).lastMap ?? null;
}

export function rememberExploreMap(collection: string, mapId: string): void {
  const save = loadExploreCollectionSave(collection);
  save.lastMap = mapId;
  saveExploreCollectionSave(collection, save);
}

export function loadExploreCollectionSave(collection: string): ExploreCollectionStorage {
  const raw = localStorage.getItem(exploreStorageKey(collection));
  if (!raw) return emptyCollectionSave();
  try {
    return normalizeExploreCollectionSave(JSON.parse(raw));
  } catch {
    return emptyCollectionSave();
  }
}

export function saveExploreCollectionSave(
  collection: string,
  save: ExploreCollectionStorage,
): ExploreCollectionStorage {
  const normalized = normalizeExploreCollectionSave(save);
  localStorage.setItem(exploreStorageKey(collection), JSON.stringify(normalized));
  return normalized;
}

export function resetExploreCollection(collection: string): void {
  localStorage.removeItem(exploreStorageKey(collection));
}

export function parseExploreCollectionExchange(value: unknown): ExploreCollectionStorage {
  return normalizeExploreCollectionSave(value, true);
}

export function serializeExploreCollectionSave(save: ExploreCollectionStorage): string {
  return JSON.stringify(normalizeExploreCollectionSave(save, true));
}

export function loadExploreProgressSave(): ExploreProgressSave {
  return {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    mode: "explore",
    collections: Object.fromEntries(
      listExploreCollectionIds().map((collection) => [collection, loadExploreCollectionSave(collection)]),
    ),
  };
}

export function saveExploreProgressSave(save: ExploreProgressSave): ExploreProgressSave {
  const normalized = normalizeExploreProgressSave(save);
  clearExploreStorage();
  for (const [collection, value] of Object.entries(normalized.collections))
    saveExploreCollectionSave(collection, value);
  return normalized;
}

export function parseExploreProgressExchange(value: unknown): ExploreProgressSave {
  return normalizeExploreProgressSave(value);
}

export function serializeExploreProgressSave(save: ExploreProgressSave): string {
  return JSON.stringify(normalizeExploreProgressSave(save));
}

function emptyCollectionSave(): ExploreCollectionStorage {
  return { game: BC5R_GAME_ID, schemaVersion: 1, completedMaps: [] };
}

function normalizeExploreCollectionSave(
  value: unknown,
  strict = false,
): ExploreCollectionStorage {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (strict) throw new Error("这段数据不是有效 Explore Collection Save");
    return emptyCollectionSave();
  }
  const raw = value as Record<string, unknown>;
  if (raw.game !== BC5R_GAME_ID || raw.schemaVersion !== 1) {
    if (strict) throw new Error("这段数据不是有效 Explore Collection Save");
    return emptyCollectionSave();
  }
  const completedMaps = Array.isArray(raw.completedMaps)
    ? [...new Set(raw.completedMaps.filter((id): id is string => typeof id === "string" && id.length > 0))].sort()
    : [];
  const lastMap = typeof raw.lastMap === "string" && raw.lastMap.length > 0 ? raw.lastMap : undefined;
  return {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    completedMaps,
    ...(lastMap ? { lastMap } : {}),
  };
}

function normalizeExploreProgressSave(value: unknown): ExploreProgressSave {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("这段数据不是有效 Explore Save");
  const raw = value as Record<string, unknown>;
  if (raw.game !== BC5R_GAME_ID || raw.schemaVersion !== 1 || raw.mode !== "explore")
    throw new Error("这段数据不是有效 Explore Save");
  const collectionsRaw = raw.collections;
  if (!collectionsRaw || typeof collectionsRaw !== "object" || Array.isArray(collectionsRaw))
    throw new Error("Explore Save 缺少 collections");
  return {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    mode: "explore",
    collections: Object.fromEntries(
      Object.entries(collectionsRaw).map(([collection, save]) => [
        collection,
        normalizeExploreCollectionSave(save, true),
      ]),
    ),
  };
}

function listExploreCollectionIds(): string[] {
  const ids: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(EXPLORE_STORAGE_PREFIX)) continue;
    const collection = key.slice(EXPLORE_STORAGE_PREFIX.length);
    if (collection) ids.push(collection);
  }
  return [...new Set(ids)].sort();
}

function clearExploreStorage(): void {
  for (const collection of listExploreCollectionIds())
    localStorage.removeItem(exploreStorageKey(collection));
}
