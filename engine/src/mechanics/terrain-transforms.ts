import type { TerrainType } from "../data/types.js";
import { Terrain } from "./ids.js";

export function toggleSpeed(id: TerrainType): TerrainType {
  if (id === Terrain.SPEED_UP) return Terrain.SPEED_DOWN;
  if (id === Terrain.SPEED_DOWN) return Terrain.SPEED_UP;
  if (id === Terrain.SPEED_LEFT) return Terrain.SPEED_RIGHT;
  if (id === Terrain.SPEED_RIGHT) return Terrain.SPEED_LEFT;
  if (id === Terrain.SPEED_SWITCH_PRESSED) return Terrain.SPEED_SWITCH_RAISED;
  if (id === Terrain.SPEED_SWITCH_RAISED) return Terrain.SPEED_SWITCH_PRESSED;
  return id;
}
export function toggleTide(id: TerrainType): TerrainType {
  if (id === Terrain.TIDE_UP) return Terrain.TIDE_DOWN;
  if (id === Terrain.TIDE_DOWN) return Terrain.TIDE_UP;
  if (id === Terrain.TIDE_LEFT) return Terrain.TIDE_RIGHT;
  if (id === Terrain.TIDE_RIGHT) return Terrain.TIDE_LEFT;
  if (id === Terrain.TIDE_SWITCH_RAISED) return Terrain.TIDE_SWITCH_PRESSED;
  if (id === Terrain.TIDE_SWITCH_PRESSED) return Terrain.TIDE_SWITCH_RAISED;
  return id;
}
export function toggleColor(
  id: TerrainType,
  color: "yellow" | "pink",
): TerrainType {
  if (color === "yellow") {
    if (id === Terrain.COLOR_YELLOW_SWITCH_RAISED)
      return Terrain.COLOR_YELLOW_SWITCH_PRESSED;
    if (id === Terrain.COLOR_YELLOW_SWITCH_PRESSED)
      return Terrain.COLOR_YELLOW_SWITCH_RAISED;
    if (id === Terrain.COLOR_YELLOW_BLOCK_RAISED)
      return Terrain.COLOR_YELLOW_BLOCK_LOWERED;
    if (id === Terrain.COLOR_YELLOW_BLOCK_LOWERED)
      return Terrain.COLOR_YELLOW_BLOCK_RAISED;
  } else {
    if (id === Terrain.COLOR_PINK_SWITCH_RAISED)
      return Terrain.COLOR_PINK_SWITCH_PRESSED;
    if (id === Terrain.COLOR_PINK_SWITCH_PRESSED)
      return Terrain.COLOR_PINK_SWITCH_RAISED;
    if (id === Terrain.COLOR_PINK_BLOCK_RAISED)
      return Terrain.COLOR_PINK_BLOCK_LOWERED;
    if (id === Terrain.COLOR_PINK_BLOCK_LOWERED)
      return Terrain.COLOR_PINK_BLOCK_RAISED;
  }
  return id;
}
export const CAROUSEL_NEXT = new Map<TerrainType, TerrainType>([
  [Terrain.CAROUSEL_1, Terrain.CAROUSEL_4],
  [Terrain.CAROUSEL_2, Terrain.CAROUSEL_1],
  [Terrain.CAROUSEL_3, Terrain.CAROUSEL_2],
  [Terrain.CAROUSEL_4, Terrain.CAROUSEL_3],
  [Terrain.CAROUSEL_VERTICAL, Terrain.CAROUSEL_HORIZONTAL],
  [Terrain.CAROUSEL_HORIZONTAL, Terrain.CAROUSEL_VERTICAL],
]);
export function rotateCarousel(id: TerrainType): TerrainType {
  return CAROUSEL_NEXT.get(id) ?? id;
}
