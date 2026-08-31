const COMPLETED_KEY = "bobby.explore.completedMaps";
const LAST_MAPS_KEY = "bobby.explore.lastMaps";

export interface ExploreProgressSave {
  game: "bc5r";
  schemaVersion: 1;
  mode: "explore";
  completedMaps: Record<string, string[]>;
  lastMaps: Record<string, string>;
}

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

export function loadExploreProgressSave(): ExploreProgressSave {
  return normalizeExploreProgressSave({
    game: "bc5r",
    schemaVersion: 1,
    mode: "explore",
    completedMaps: readCompletedMaps(),
    lastMaps: readLastMaps(),
  });
}

export function saveExploreProgressSave(
  save: ExploreProgressSave,
): ExploreProgressSave {
  const normalized = normalizeExploreProgressSave(save);
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(normalized.completedMaps));
  localStorage.setItem(LAST_MAPS_KEY, JSON.stringify(normalized.lastMaps));
  return normalized;
}

export function parseExploreProgressExchange(value: unknown): ExploreProgressSave {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as Record<string, unknown>).game !== "bc5r" ||
    (value as Record<string, unknown>).schemaVersion !== 1 ||
    (value as Record<string, unknown>).mode !== "explore"
  ) {
    throw new Error("这段数据不是有效 Explore Save");
  }
  return normalizeExploreProgressSave(value as ExploreProgressSave);
}

export function serializeExploreProgressSave(save: ExploreProgressSave): string {
  return JSON.stringify(normalizeExploreProgressSave(save));
}

function normalizeExploreProgressSave(save: ExploreProgressSave): ExploreProgressSave {
  return {
    game: "bc5r",
    schemaVersion: 1,
    mode: "explore",
    completedMaps: normalizeCompletedMaps(save.completedMaps),
    lastMaps: normalizeLastMaps(save.lastMaps),
  };
}

function readCompletedMaps(): Record<string, string[]> {
  try {
    return normalizeCompletedMaps(
      JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? "{}"),
    );
  } catch {
    return {};
  }
}

function readLastMaps(): Record<string, string> {
  try {
    return normalizeLastMaps(
      JSON.parse(localStorage.getItem(LAST_MAPS_KEY) ?? "{}"),
    );
  } catch {
    return {};
  }
}

function normalizeCompletedMaps(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([collection, ids]) => {
      if (!Array.isArray(ids)) return [];
      const normalized = [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0))].sort();
      return [[collection, normalized]];
    }),
  );
}

function normalizeLastMaps(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].length > 0,
    ),
  );
}
