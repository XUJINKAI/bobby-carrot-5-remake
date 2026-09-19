import { BC5R_GAME_ID } from "@bobby/model";
import { WEB_ERROR_CODES, WebError } from "../errors/errorCodes.js";
import {
  exploreStorageKey,
  type ExploreCollectionStorage,
} from "./contracts.js";

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
  if (!raw) return emptyCollectionSave(collection);
  try {
    return normalizeExploreCollectionSave(JSON.parse(raw), collection);
  } catch {
    return emptyCollectionSave(collection);
  }
}

export function saveExploreCollectionSave(
  collection: string,
  save: ExploreCollectionStorage,
): ExploreCollectionStorage {
  const normalized = normalizeExploreCollectionSave(save, collection, true);
  localStorage.setItem(exploreStorageKey(collection), JSON.stringify(normalized));
  return normalized;
}

export function resetExploreCollection(collection: string): void {
  localStorage.removeItem(exploreStorageKey(collection));
}

export function parseExploreCollectionExchange(
  value: unknown,
  expectedCollection?: string,
): ExploreCollectionStorage {
  try {
    return normalizeExploreCollectionSave(value, expectedCollection, true);
  } catch (cause) {
    throw new WebError(
      WEB_ERROR_CODES.saveExchange.invalidExploreSave,
      { cause },
    );
  }
}

export function serializeExploreCollectionSave(save: ExploreCollectionStorage): string {
  return JSON.stringify(normalizeExploreCollectionSave(save, undefined, true));
}

export function exploreSaveCollection(save: ExploreCollectionStorage): string {
  const collection = collectionFromScope(save.scope);
  if (collection === null) throw new Error("Explore Collection Save scope 无效");
  return collection;
}

function emptyCollectionSave(collection: string): ExploreCollectionStorage {
  return {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    scope: `explore/${validatedCollectionId(collection)}`,
    completedMaps: [],
  };
}

function normalizeExploreCollectionSave(
  value: unknown,
  expectedCollection?: string,
  strict = false,
): ExploreCollectionStorage {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (strict) throw new Error("这段数据不是有效 Explore Collection Save");
    if (expectedCollection) return emptyCollectionSave(expectedCollection);
    throw new Error("Explore Collection Save 缺少 collection");
  }
  const raw = value as Record<string, unknown>;
  const collection = typeof raw.scope === "string"
    ? collectionFromScope(raw.scope)
    : null;
  const expected = expectedCollection === undefined
    ? undefined
    : validatedCollectionId(expectedCollection);
  if (
    raw.game !== BC5R_GAME_ID ||
    raw.schemaVersion !== 1 ||
    collection === null ||
    (expected !== undefined && collection !== expected)
  ) {
    if (strict) throw new Error("这段数据不是有效 Explore Collection Save");
    if (expected) return emptyCollectionSave(expected);
    throw new Error("Explore Collection Save scope 无效");
  }
  const completedMaps = Array.isArray(raw.completedMaps)
    ? [...new Set(raw.completedMaps.filter((id): id is string => typeof id === "string" && id.length > 0))].sort()
    : [];
  if (
    strict &&
    (
      !Array.isArray(raw.completedMaps) ||
      raw.completedMaps.some(
        (id) => typeof id !== "string" || id.length === 0,
      )
    )
  ) throw new Error("Explore Collection Save 的 completedMaps 无效");
  if (
    strict &&
    raw.lastMap !== undefined &&
    (typeof raw.lastMap !== "string" || raw.lastMap.length === 0)
  ) throw new Error("Explore Collection Save 的 lastMap 无效");
  const lastMap = typeof raw.lastMap === "string" && raw.lastMap.length > 0 ? raw.lastMap : undefined;
  return {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    scope: `explore/${collection}`,
    completedMaps,
    ...(lastMap ? { lastMap } : {}),
  };
}

function collectionFromScope(scope: string): string | null {
  if (!scope.startsWith("explore/")) return null;
  const collection = scope.slice("explore/".length);
  try {
    return validatedCollectionId(collection);
  } catch {
    return null;
  }
}

function validatedCollectionId(collection: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collection))
    throw new Error(`Explore Save collection ID 无效：${JSON.stringify(collection)}`);
  return collection;
}
