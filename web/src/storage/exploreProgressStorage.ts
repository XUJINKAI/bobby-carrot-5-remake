const COMPLETED_KEY = "bobby.explore.completedMaps";
const LAST_MAPS_KEY = "bobby.explore.lastMaps";

export function completedExploreMapIds(collection: string): Set<string> {
  const completed = readCompletedMaps();
  return new Set(completed[collection] ?? []);
}

export function markExploreMapCompleted(collection: string, mapId: string): void {
  const completed = readCompletedMaps();
  const ids = new Set(completed[collection] ?? []);
  ids.add(mapId);
  completed[collection] = [...ids].sort();
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
}

export function lastExploreMapId(collection: string): string | null {
  return readLastMaps()[collection] ?? null;
}

export function rememberExploreMap(collection: string, mapId: string): void {
  const maps = readLastMaps();
  maps[collection] = mapId;
  localStorage.setItem(LAST_MAPS_KEY, JSON.stringify(maps));
}

function readCompletedMaps(): Record<string, string[]> {
  try {
    const value = JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).flatMap(([collection, ids]) =>
        Array.isArray(ids)
          ? [[collection, ids.filter((id): id is string => typeof id === "string")]]
          : [],
      ),
    );
  } catch {
    return {};
  }
}

function readLastMaps(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_MAPS_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}
