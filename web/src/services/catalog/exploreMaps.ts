import type { LevelMap } from "@bobby/model";
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
  return {
    ref,
    document,
    level: levelMapFromDocument(document),
  };
}
