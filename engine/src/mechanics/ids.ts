import type { ObjectType, TerrainType } from '../data/types.js';

export const EMPTY_OBJECT: ObjectType = 'empty';

export const Terrain = {
  SNOW: 'snow',
  WATER: 'water',
  WATER_ANIMATED: 'water-animated',
  TIDE_UP: 'tide-up', TIDE_DOWN: 'tide-down', TIDE_LEFT: 'tide-left', TIDE_RIGHT: 'tide-right',
  WATER_VARIANT_1: 'water-variant-1', WATER_VARIANT_2: 'water-variant-2', WATER_VARIANT_3: 'water-variant-3',
  GROUND_A: 'ground-a', GROUND_B: 'ground-b', GROUND_C: 'ground-c', GROUND_D: 'ground-d',
  SHOVEL_CLEARED_GROUND: 'shovel-cleared-ground',
  ICE: 'ice', START: 'start', EXIT: 'exit',
  SHOP_DREAM: 'shop-dream', SHOP_CLOUD9: 'shop-cloud9', SHOP_SUPER_KEY: 'shop-super-key', SHOP_STEREO: 'shop-stereo',
  SHOP_MUSIC: 'shop-music', SHOP_SPEED_SHOES: 'shop-speed-shoes', SHOP_COIN_RADAR: 'shop-coin-radar', SHOP_UNAVAILABLE: 'shop-unavailable',
  SHOVEL_PICKUP: 'shovel-pickup', MOWER_PARKING: 'mower-parking',
  SPEED_SWITCH_PRESSED: 'speed-switch-pressed', SPEED_SWITCH_RAISED: 'speed-switch-raised',
  CAROUSEL_SWITCH_RAISED: 'carousel-switch-raised', CAROUSEL_SWITCH_PRESSED: 'carousel-switch-pressed',
  TIDE_SWITCH_RAISED: 'tide-switch-raised', TIDE_SWITCH_PRESSED: 'tide-switch-pressed',
  WIND_SWITCH_0_ON: 'wind-switch-0-on', WIND_SWITCH_0_OFF: 'wind-switch-0-off',
  WIND_SWITCH_1_ON: 'wind-switch-1-on', WIND_SWITCH_1_OFF: 'wind-switch-1-off',
  WIND_SWITCH_2_ON: 'wind-switch-2-on', WIND_SWITCH_2_OFF: 'wind-switch-2-off',
  WIND_SWITCH_3_ON: 'wind-switch-3-on', WIND_SWITCH_3_OFF: 'wind-switch-3-off',
  TRAP_ACTIVE: 'trap-active', TRAP_INACTIVE: 'trap-inactive',
  MIRROR_1: 'mirror-1', MIRROR_2: 'mirror-2', MIRROR_3: 'mirror-3', MIRROR_4: 'mirror-4',
  SPEED_UP: 'speed-up', SPEED_DOWN: 'speed-down', SPEED_LEFT: 'speed-left', SPEED_RIGHT: 'speed-right',
  CAROUSEL_1: 'carousel-1', CAROUSEL_2: 'carousel-2', CAROUSEL_3: 'carousel-3', CAROUSEL_4: 'carousel-4',
  CAROUSEL_VERTICAL: 'carousel-vertical', CAROUSEL_HORIZONTAL: 'carousel-horizontal',
  COLOR_YELLOW_SWITCH_RAISED: 'color-yellow-switch-raised', COLOR_YELLOW_SWITCH_PRESSED: 'color-yellow-switch-pressed',
  COLOR_PINK_SWITCH_RAISED: 'color-pink-switch-raised', COLOR_PINK_SWITCH_PRESSED: 'color-pink-switch-pressed',
  COLOR_YELLOW_BLOCK_RAISED: 'color-yellow-block-raised', COLOR_YELLOW_BLOCK_LOWERED: 'color-yellow-block-lowered',
  COLOR_PINK_BLOCK_RAISED: 'color-pink-block-raised', COLOR_PINK_BLOCK_LOWERED: 'color-pink-block-lowered',
  HIGH_GRASS: 'high-grass', HIGH_GRASS_OBJECTIVE: 'high-grass-objective'
} as const satisfies Record<string, TerrainType>;

export const ObjectId = {
  CONSUMED_CARROT: 'consumed-carrot', CARROT: 'carrot', EGG_NEST_EMPTY: 'egg-nest-empty', EGG_NEST_FILLED: 'egg-nest-filled',
  LOCK: 'lock', BEANSTALK_TIP: 'beanstalk-tip', BEAN: 'bean',
  WINDMILL_UP: 'windmill-up', WINDMILL_DOWN: 'windmill-down', WINDMILL_LEFT: 'windmill-left', WINDMILL_RIGHT: 'windmill-right',
  PLANK: 'plank', PLANK_CRUMBLING: 'plank-crumbling', PLANK_FRAGMENT: 'plank-fragment',
  DRAGON_HEAD_BASE: 'dragon-head', DRAGON_BODY: 'dragon-body', DRAGON_TAIL: 'dragon-tail', SANDMAN: 'sandman', DREAM_MACHINE: 'dream-machine',
  MOWER: 'mower', GAS: 'gas', BEANSTALK_MID: 'beanstalk-mid', BEAN_FIELD: 'bean-field',
  CLOUD_RED: 'cloud-red', CLOUD_PURPLE: 'cloud-purple', CLOUD_GREEN: 'cloud-green', ICE_BLOCK: 'ice-block',
  ICE_MELT_1: 'ice-melt-1', ICE_MELT_2: 'ice-melt-2', ICE_MELT_3: 'ice-melt-3', BEAVER_BASE: 'beaver-base',
  DRAGON_ANIM_1: 'dragon-anim-1', DRAGON_ANIM_2: 'dragon-anim-2', SANDMAN_BODY: 'sandman-body', DREAM_MACHINE_BODY: 'dream-machine-body',
  LEAF: 'leaf', CRUMBLY_ROCK: 'crumbly-rock', BEANSTALK_BASE: 'beanstalk-base', BEAN_SPROUT: 'bean-sprout',
  CLOUD_GRID_RED: 'cloud-grid-red', CLOUD_GRID_PURPLE: 'cloud-grid-purple', CLOUD_GRID_GREEN: 'cloud-grid-green',
  KITE: 'kite', WHIRLWIND: 'whirlwind', LANDING: 'landing', GOLDEN_CARROT: 'golden-carrot', BEAVER_BODY: 'beaver-body', BONUS_COIN: 'bonus-coin',
  FENCE_1: 'fence-1', FENCE_2: 'fence-2', FENCE_3: 'fence-3', FENCE_4: 'fence-4', FENCE_5: 'fence-5', FENCE_6: 'fence-6',
  EMPTY: 'empty'
} as const satisfies Record<string, ObjectType>;

export type Direction = 'left' | 'right' | 'up' | 'down';
export interface StepVector { dx: number; dy: number; }

export const DIRECTIONS: Record<Direction, StepVector> = {
  left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 }, up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 }
};

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  left: 'right', right: 'left', up: 'down', down: 'up'
};

export const SPEED_TERRAIN_DIRECTION = new Map<TerrainType, Direction>([
  [Terrain.SPEED_LEFT, 'left'], [Terrain.SPEED_RIGHT, 'right'], [Terrain.SPEED_UP, 'up'], [Terrain.SPEED_DOWN, 'down']
]);

export const TIDE_TERRAIN_DIRECTION = new Map<TerrainType, Direction>([
  [Terrain.TIDE_UP, 'up'], [Terrain.TIDE_DOWN, 'down'], [Terrain.TIDE_LEFT, 'left'], [Terrain.TIDE_RIGHT, 'right']
]);

export const WINDMILL_DIRECTION = new Map<ObjectType, Direction>([
  [ObjectId.WINDMILL_UP, 'up'], [ObjectId.WINDMILL_DOWN, 'down'], [ObjectId.WINDMILL_LEFT, 'left'], [ObjectId.WINDMILL_RIGHT, 'right']
]);

export const DYNAMIC_OBJECT_IDS = new Set<ObjectType>([ObjectId.CLOUD_RED, ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GREEN, ObjectId.LEAF]);
export const CLOUD_OBJECT_IDS = new Set<ObjectType>([ObjectId.CLOUD_RED, ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GREEN]);
export const CLOUD_GRID_FOR_OBJECT = new Map<ObjectType, ObjectType>([
  [ObjectId.CLOUD_RED, ObjectId.CLOUD_GRID_RED], [ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GRID_PURPLE], [ObjectId.CLOUD_GREEN, ObjectId.CLOUD_GRID_GREEN]
]);

export function directionFromDelta(dx: number, dy: number): Direction | null {
  if (dx === -1 && dy === 0) return 'left';
  if (dx === 1 && dy === 0) return 'right';
  if (dx === 0 && dy === -1) return 'up';
  if (dx === 0 && dy === 1) return 'down';
  return null;
}
