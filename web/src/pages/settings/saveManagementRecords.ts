import type { MapCollectionSummary } from "../../services/catalog/catalog.js";
import {
  ADVENTURE_STORAGE_KEY,
  exploreStorageKey,
} from "../../storage/contracts.js";

export type SaveManagementTarget =
  | {
      id: "adventure";
      kind: "adventure";
    }
  | {
      id: `explore:${string}`;
      kind: "explore";
      collection: string;
    };

/**
 * 设置页只展示 discovery index 允许且浏览器中实际存在的存档。
 * Explore 顺序完全跟随 maps/index.json，与 Explore 页面一致。
 */
export function listSaveManagementTargets(
  collections: readonly Pick<MapCollectionSummary, "id">[],
  storage: Storage = localStorage,
): SaveManagementTarget[] {
  const targets: SaveManagementTarget[] = [];
  if (storage.getItem(ADVENTURE_STORAGE_KEY) !== null) {
    targets.push({
      id: "adventure",
      kind: "adventure",
    });
  }

  for (const { id: collection } of collections) {
    if (storage.getItem(exploreStorageKey(collection)) === null) continue;
    targets.push({
      id: `explore:${collection}`,
      kind: "explore",
      collection,
    });
  }
  return targets;
}
