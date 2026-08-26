import type { LevelMap } from "@bobby/model";
import type { ExploreMapRef } from "../../app/routes.js";
import { siteUrl } from "../assets/gameAssets.js";
import {
  fetchJson,
  type CatalogLevel,
  type CustomMapCatalog,
  type LevelCatalog,
  type OfficialLevelData,
} from "./catalog.js";

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
  if (ref.collection === "original") {
    const official = catalog.levels.find((entry) => entry.publicId === ref.id);
    if (!official) return undefined;
    const level = await fetchJson<OfficialLevelData>(
      siteUrl(`assets/${official.path}`),
    );
    return {
      ref,
      title: official.publicId.toUpperCase(),
      level,
      official,
    };
  }
  const collection = customMapCatalog.collections.find(
    (entry) => entry.id === ref.collection,
  );
  const map = collection?.maps.find((entry) => entry.id === ref.id);
  if (!map) return undefined;
  return {
    ref,
    title: map.name,
    level: await fetchJson<LevelMap>(siteUrl(`assets/${map.path}`)),
  };
}
