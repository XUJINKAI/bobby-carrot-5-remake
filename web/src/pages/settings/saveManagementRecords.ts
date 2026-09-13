import {
  ADVENTURE_STORAGE_KEY,
  EXPLORE_STORAGE_PREFIX,
} from "../../storage/contracts.js";

export type SaveManagementTarget =
  | {
      id: "adventure";
      kind: "adventure";
      label: "Adventure";
    }
  | {
      id: `explore:${string}`;
      kind: "explore";
      label: string;
      collection: string;
    };

/** 设置页只展示浏览器中实际存在的独立存档 record。 */
export function listSaveManagementTargets(
  storage: Storage = localStorage,
): SaveManagementTarget[] {
  const targets: SaveManagementTarget[] = [];
  if (storage.getItem(ADVENTURE_STORAGE_KEY) !== null) {
    targets.push({
      id: "adventure",
      kind: "adventure",
      label: "Adventure",
    });
  }

  const collections = new Set<string>();
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(EXPLORE_STORAGE_PREFIX)) continue;
    const collection = key.slice(EXPLORE_STORAGE_PREFIX.length);
    if (collection) collections.add(collection);
  }

  for (const collection of [...collections].sort()) {
    targets.push({
      id: `explore:${collection}`,
      kind: "explore",
      label: `Explore / ${collection}`,
      collection,
    });
  }
  return targets;
}
