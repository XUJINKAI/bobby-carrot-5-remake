import type { ObjectType, TerrainType } from '../data/types.js';
import { ObjectId, Terrain } from '../mechanics/ids.js';

export interface AtlasCell { column: number; row: number; }

function cell(column: number, row: number): AtlasCell { return { column, row }; }

/**
 * Mapping for the original HD ts.png art atlas.
 *
 * These are art coordinates, not DAT codes. Gameplay/data layers never infer behavior
 * from atlas position, and swapping the art atlas only requires replacing this module.
 */
const TERRAIN_ART = new Map<TerrainType, AtlasCell>([
  [Terrain.SNOW, cell(13, 4)],
  [Terrain.WATER, cell(5, 5)], [Terrain.WATER_ANIMATED, cell(6, 5)],
  [Terrain.TIDE_UP, cell(7, 5)], [Terrain.TIDE_DOWN, cell(8, 5)], [Terrain.TIDE_LEFT, cell(9, 5)], [Terrain.TIDE_RIGHT, cell(10, 5)],
  [Terrain.WATER_VARIANT_1, cell(11, 5)], [Terrain.WATER_VARIANT_2, cell(12, 5)], [Terrain.WATER_VARIANT_3, cell(13, 5)],
  [Terrain.GROUND_A, cell(14, 5)], [Terrain.GROUND_B, cell(15, 5)],
  [Terrain.SHOVEL_CLEARED_GROUND, cell(12, 7)],
  [Terrain.GROUND_C, cell(0, 9)], [Terrain.GROUND_D, cell(1, 9)], [Terrain.ICE, cell(4, 9)], [Terrain.START, cell(5, 9)], [Terrain.EXIT, cell(6, 9)],
  [Terrain.SHOP_DREAM, cell(7, 9)], [Terrain.SHOP_CLOUD9, cell(8, 9)], [Terrain.SHOP_SUPER_KEY, cell(9, 9)], [Terrain.SHOP_STEREO, cell(10, 9)],
  [Terrain.SHOP_MUSIC, cell(11, 9)], [Terrain.SHOP_SPEED_SHOES, cell(12, 9)], [Terrain.SHOP_COIN_RADAR, cell(13, 9)], [Terrain.SHOP_UNAVAILABLE, cell(14, 9)],
  [Terrain.SHOVEL_PICKUP, cell(15, 9)], [Terrain.MOWER_PARKING, cell(0, 10)],
  [Terrain.SPEED_SWITCH_PRESSED, cell(1, 10)], [Terrain.SPEED_SWITCH_RAISED, cell(2, 10)],
  [Terrain.CAROUSEL_SWITCH_RAISED, cell(3, 10)], [Terrain.CAROUSEL_SWITCH_PRESSED, cell(4, 10)],
  [Terrain.TIDE_SWITCH_RAISED, cell(5, 10)], [Terrain.TIDE_SWITCH_PRESSED, cell(6, 10)],
  [Terrain.WIND_SWITCH_0_ON, cell(7, 10)], [Terrain.WIND_SWITCH_0_OFF, cell(8, 10)],
  [Terrain.WIND_SWITCH_1_ON, cell(9, 10)], [Terrain.WIND_SWITCH_1_OFF, cell(10, 10)],
  [Terrain.WIND_SWITCH_2_ON, cell(11, 10)], [Terrain.WIND_SWITCH_2_OFF, cell(12, 10)],
  [Terrain.WIND_SWITCH_3_ON, cell(13, 10)], [Terrain.WIND_SWITCH_3_OFF, cell(14, 10)],
  [Terrain.TRAP_ACTIVE, cell(15, 10)], [Terrain.TRAP_INACTIVE, cell(0, 11)],
  [Terrain.MIRROR_1, cell(1, 11)], [Terrain.MIRROR_2, cell(2, 11)], [Terrain.MIRROR_3, cell(3, 11)], [Terrain.MIRROR_4, cell(4, 11)],
  [Terrain.SPEED_UP, cell(5, 11)], [Terrain.SPEED_DOWN, cell(6, 11)], [Terrain.SPEED_LEFT, cell(7, 11)], [Terrain.SPEED_RIGHT, cell(8, 11)],
  [Terrain.CAROUSEL_1, cell(9, 11)], [Terrain.CAROUSEL_2, cell(10, 11)], [Terrain.CAROUSEL_3, cell(11, 11)], [Terrain.CAROUSEL_4, cell(12, 11)],
  [Terrain.CAROUSEL_VERTICAL, cell(13, 11)], [Terrain.CAROUSEL_HORIZONTAL, cell(14, 11)],
  [Terrain.COLOR_YELLOW_SWITCH_RAISED, cell(15, 11)], [Terrain.COLOR_YELLOW_SWITCH_PRESSED, cell(0, 12)],
  [Terrain.COLOR_PINK_SWITCH_RAISED, cell(1, 12)], [Terrain.COLOR_PINK_SWITCH_PRESSED, cell(2, 12)],
  [Terrain.COLOR_YELLOW_BLOCK_RAISED, cell(3, 12)], [Terrain.COLOR_YELLOW_BLOCK_LOWERED, cell(4, 12)],
  [Terrain.COLOR_PINK_BLOCK_RAISED, cell(5, 12)], [Terrain.COLOR_PINK_BLOCK_LOWERED, cell(6, 12)],
  [Terrain.HIGH_GRASS, cell(7, 12)], [Terrain.HIGH_GRASS_OBJECTIVE, cell(8, 12)]
]);

const OBJECT_ORDER: readonly ObjectType[] = [
  ObjectId.CONSUMED_CARROT, ObjectId.CARROT, ObjectId.EGG_NEST_EMPTY, ObjectId.EGG_NEST_FILLED, ObjectId.LOCK,
  ObjectId.BEANSTALK_TIP, ObjectId.BEAN, ObjectId.WINDMILL_UP, ObjectId.WINDMILL_DOWN, ObjectId.WINDMILL_LEFT, ObjectId.WINDMILL_RIGHT,
  ObjectId.PLANK, ObjectId.PLANK_CRUMBLING, ObjectId.PLANK_FRAGMENT, ObjectId.DRAGON_HEAD_BASE, ObjectId.DRAGON_BODY, ObjectId.DRAGON_TAIL,
  ObjectId.SANDMAN, ObjectId.DREAM_MACHINE, ObjectId.MOWER, ObjectId.GAS, ObjectId.BEANSTALK_MID, ObjectId.BEAN_FIELD,
  ObjectId.CLOUD_RED, ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GREEN, ObjectId.ICE_BLOCK, ObjectId.ICE_MELT_1, ObjectId.ICE_MELT_2, ObjectId.ICE_MELT_3,
  ObjectId.BEAVER_BASE, ObjectId.DRAGON_ANIM_1, ObjectId.DRAGON_ANIM_2, ObjectId.SANDMAN_BODY, ObjectId.DREAM_MACHINE_BODY, ObjectId.LEAF,
  ObjectId.CRUMBLY_ROCK, ObjectId.BEANSTALK_BASE, ObjectId.BEAN_SPROUT, ObjectId.CLOUD_GRID_RED, ObjectId.CLOUD_GRID_PURPLE, ObjectId.CLOUD_GRID_GREEN,
  ObjectId.KITE, ObjectId.WHIRLWIND, ObjectId.LANDING, ObjectId.GOLDEN_CARROT, ObjectId.BEAVER_BODY, ObjectId.BONUS_COIN,
  ObjectId.FENCE_1, ObjectId.FENCE_2, ObjectId.FENCE_3, ObjectId.FENCE_4, ObjectId.FENCE_5, ObjectId.FENCE_6, ObjectId.EMPTY
];

const OBJECT_ART = new Map<ObjectType, AtlasCell>();
for (let index = 0; index < OBJECT_ORDER.length; index += 1) {
  // Object art starts at column 9, row 12 and then continues row-major.
  const linear = 9 + index;
  OBJECT_ART.set(OBJECT_ORDER[index]!, cell(linear % 16, 12 + Math.floor(linear / 16)));
}

export function terrainAtlasCell(type: TerrainType): AtlasCell {
  const known = TERRAIN_ART.get(type);
  if (known) return known;

  const walkable = /^walkable-variant-(\d+)$/.exec(type);
  if (walkable) {
    const ordinal = Math.max(1, Number(walkable[1]));
    // Unnamed walkable art family begins at the first cell of atlas row 6.
    const linear = (6 * 16) + ordinal - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }

  const background = /^background-variant-(\d+)$/.exec(type);
  if (background) {
    const ordinal = Math.max(1, Number(background[1]));
    const linear = ordinal - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }

  throw new Error(`No terrain atlas mapping for ${type}`);
}

export function objectAtlasCell(type: ObjectType): AtlasCell {
  const known = OBJECT_ART.get(type);
  if (known) return known;
  const variant = /^object-variant-(\d+)$/.exec(type);
  if (variant) {
    const ordinal = Math.max(1, Number(variant[1]));
    const linear = ordinal - 1;
    return cell(linear % 16, Math.floor(linear / 16));
  }
  throw new Error(`No object atlas mapping for ${type}`);
}
