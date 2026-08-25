import type { CatalogLevel, LevelCatalog } from "./catalog.js";

export function resolveCatalogLevel(
  catalog: LevelCatalog,
  preferredId: string | null,
): CatalogLevel {
  const preferred = preferredId
    ? catalog.levels.find((level) => level.publicId === preferredId)
    : undefined;
  return (
    preferred ??
    catalog.levels.find((level) => level.publicId === "1-1") ??
    catalog.levels[0]!
  );
}

export function randomCatalogLevel(catalog: LevelCatalog): CatalogLevel {
  return (
    catalog.levels[Math.floor(Math.random() * catalog.levels.length)] ??
    catalog.levels[0]!
  );
}
