import { parseMapDocument, type LevelMap } from "@bobby/model";
import type { ExploreMapRef } from "../../app/routes.js";
import { siteUrl } from "../assets/gameAssets.js";
import { mapAssetUrl } from "../../app/routes.js";
import {
  fetchJson,
  levelMapFromDocument,
  type MapDocument,
} from "./catalog.js";

export interface ResolvedMapDocument {
  ref: ExploreMapRef;
  document: MapDocument;
  level: LevelMap;
}

const MAX_CACHED_MAPS = 12;
const mapRequests = new Map<string, Promise<ResolvedMapDocument>>();

export async function resolveMapDocument(
  ref: ExploreMapRef,
): Promise<ResolvedMapDocument> {
  const key = mapCacheKey(ref);
  const cached = mapRequests.get(key);
  if (cached) {
    mapRequests.delete(key);
    mapRequests.set(key, cached);
    return cached;
  }
  const request = loadMapDocument(ref);
  mapRequests.set(key, request);
  trimMapCache();
  try {
    return await request;
  } catch (error) {
    if (mapRequests.get(key) === request) mapRequests.delete(key);
    throw error;
  }
}

export async function prefetchMapDocument(ref: ExploreMapRef): Promise<void> {
  await resolveMapDocument(ref);
}

async function loadMapDocument(
  ref: ExploreMapRef,
): Promise<ResolvedMapDocument> {
  const value = await fetchJson<unknown>(
    siteUrl(mapAssetUrl(ref.collection, ref.id)),
  );
  let document: MapDocument;
  try {
    document = parseMapDocument(value);
  } catch (cause) {
    throw new Error(`${ref.collection}/${ref.id}: 地图合同无效`, { cause });
  }
  return {
    ref,
    document,
    level: levelMapFromDocument(document),
  };
}

function mapCacheKey(ref: ExploreMapRef): string {
  return `${ref.collection.toLowerCase()}/${ref.id.toLowerCase()}`;
}

function trimMapCache(): void {
  while (mapRequests.size > MAX_CACHED_MAPS) {
    const oldest = mapRequests.keys().next().value;
    if (typeof oldest !== "string") return;
    mapRequests.delete(oldest);
  }
}
