import type { CatalogLevel } from "./catalog.js";

export function displayLevelId(level: CatalogLevel): string {
  return level.publicId.toUpperCase();
}

export function displayLevelShort(level: CatalogLevel): string {
  return level.bonusOrdinal
    ? `BONUS ${level.bonusOrdinal}`
    : String(level.sourceLevelIndex);
}

export function chapterStars(stars: number): string {
  return `${"★".repeat(stars)}${"☆".repeat(Math.max(0, 3 - stars))}`;
}
