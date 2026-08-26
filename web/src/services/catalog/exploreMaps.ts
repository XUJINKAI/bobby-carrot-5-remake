import type { LevelMap } from "@bobby/model";
import type { ExploreMapRef } from "../../app/routes.js";
import { siteUrl } from "../assets/gameAssets.js";
import { mapAssetUrl } from "../../app/routes.js";
import {
  fetchJson,
  levelMapFromDocument,
  type CatalogLevel,
  type CustomMapCatalog,
  type LevelCatalog,
  type MapDocument,
  type OfficialLevelData,
} from "./catalog.js";

export interface ResolvedMapDocument {
  ref: ExploreMapRef;
  document: MapDocument;
  level: LevelMap;
}

export async function resolveMapDocument(
  ref: ExploreMapRef,
): Promise<ResolvedMapDocument> {
  const document = await fetchJson<MapDocument>(
    siteUrl(mapAssetUrl(ref.collection, ref.id)),
  );
  if (document.schemaVersion !== 1)
    throw new Error(
      `${ref.collection}/${ref.id}: map schemaVersion 必须为 1`,
    );
  if (document.meta?.id !== ref.id)
    throw new Error(
      `${ref.collection}/${ref.id}: meta.id 与资源 ID 不一致`,
    );
  return {
    ref,
    document,
    level: levelMapFromDocument(document),
  };
}

export interface ResolvedExploreMap {
  ref: ExploreMapRef;
  title: string;
  level: LevelMap;
  official?: CatalogLevel;
}

export async function resolveExploreMap(
  catalog: LevelCatalog,
  customMapCatalog: CustomMapCatalog,
  ref: ExploreMapRef,
): Promise<ResolvedExploreMap | undefined> {
  const resolved = await resolveMapDocument(ref);
  if (ref.collection === "original") {
    const official = catalog.levels.find((entry) => entry.publicId === ref.id);
    return {
      ref,
      title: resolved.document.meta.name,
      level: resolved.level as OfficialLevelData,
      ...(official ? { official } : {}),
    };
  }
  const collection = customMapCatalog.collections.find(
    (entry) => entry.id === ref.collection,
  );
  const map = collection?.maps.find((entry) => entry.id === ref.id);
  return {
    ref,
    title: resolved.document.meta.name ?? map?.name ?? ref.id,
    level: resolved.level,
  };
}
