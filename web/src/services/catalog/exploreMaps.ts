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

export async function resolveMapDocument(
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
