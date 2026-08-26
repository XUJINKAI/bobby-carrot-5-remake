const COMPLETED_KEY = "bobby.explore.completedLevels";
const LAST_LEVEL_KEY = "bobby.explore.lastLevel";
const LAST_MAPS_KEY = "bobby.explore.lastMaps";

export function completedExploreLevels(): Set<string> {
  try {
    const value = JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? "[]");
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}
export function markExploreLevelCompleted(canonicalId: string): void {
  const completed = completedExploreLevels();
  completed.add(canonicalId);
  localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed].sort()));
}
export function lastExploreLevelId(): string | null {
  return lastExploreMapId("original") ?? localStorage.getItem(LAST_LEVEL_KEY);
}
export function rememberExploreLevel(publicId: string): void {
  rememberExploreMap("original", publicId);
}

export function lastExploreMapId(collection: string): string | null {
  return readLastMaps()[collection] ?? null;
}

export function rememberExploreMap(collection: string, mapId: string): void {
  const maps = readLastMaps();
  maps[collection] = mapId;
  localStorage.setItem(LAST_MAPS_KEY, JSON.stringify(maps));
}

function readLastMaps(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_MAPS_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}
