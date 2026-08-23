import type { TerrainType } from '../data/types.js';
import { Terrain } from './ids.js';

const WATER = new Set<TerrainType>([
  Terrain.WATER,
  Terrain.WATER_ANIMATED,
  Terrain.TIDE_UP,
  Terrain.TIDE_DOWN,
  Terrain.TIDE_LEFT,
  Terrain.TIDE_RIGHT,
  Terrain.WATER_VARIANT_1,
  Terrain.WATER_VARIANT_2,
  Terrain.WATER_VARIANT_3
]);

const BEANSTALK_GROWTH_BACKGROUND = new Set<TerrainType>([
  Terrain.WATER,
  Terrain.WATER_ANIMATED,
  Terrain.TIDE_UP,
  Terrain.TIDE_DOWN,
  Terrain.TIDE_LEFT,
  Terrain.TIDE_RIGHT,
  Terrain.WATER_VARIANT_1,
  Terrain.WATER_VARIANT_2,
  Terrain.WATER_VARIANT_3
]);

/** Gameplay-facing water classification. No DAT numeric range knowledge lives here. */
export function isWaterTerrainType(type: TerrainType): boolean {
  return WATER.has(type);
}

/**
 * Ordinary collision fallback. The DAT codec labels still-unnamed members of the
 * original confirmed walkable family as `walkable-variant-*`, so the Engine only
 * consumes the semantic category rather than reconstructing the original byte range.
 */
export function isOrdinaryWalkableTerrainType(type: TerrainType): boolean {
  if (type.startsWith('walkable-variant-')) return true;
  if (type.startsWith('background-variant-')) return false;
  if (isWaterTerrainType(type) || type === Terrain.SNOW) return false;
  return true;
}

/**
 * The original beanstalk rule allows several low/background tiles. We expose that
 * as a semantic trait rather than a byte comparison. Unknown members of that family
 * are intentionally emitted by the codec as background variants and are not guessed here.
 */
export function allowsBeanstalkGrowth(type: TerrainType): boolean {
  return BEANSTALK_GROWTH_BACKGROUND.has(type) || type.startsWith('background-variant-');
}

/** Conservative cloud traversal background classification expressed in semantic terms. */
export function isCloudPassableBackground(type: TerrainType): boolean {
  return isOrdinaryWalkableTerrainType(type) || isWaterTerrainType(type) || type.startsWith('background-variant-');
}

/** Dragon fire can traverse ordinary floor, water and background variants. */
export function isDragonFireBackground(type: TerrainType): boolean {
  return isOrdinaryWalkableTerrainType(type) || isWaterTerrainType(type) || type.startsWith('background-variant-');
}
