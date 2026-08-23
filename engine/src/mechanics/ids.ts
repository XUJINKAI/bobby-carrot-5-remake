/**
 * Bobby Carrot 5 地图 ID 表。
 *
 * 原版 Java ME 使用 signed byte，因此反编译里常看到 -54、-36 等负数；
 * Web 运行时统一使用 0..255 的 unsigned byte，并在注释中保留 signed 值方便对照字节码。
 *
 * 下列“已确认”项来自 UP9 高清版 v1.x 的 a.class 字节码与 EN.dat 帮助文本交叉验证。
 * 少数动态机关的方向行为仍带有推断成分，会在对应实现处注明。
 */

export const EMPTY_OBJECT = 0xff; // signed -1，原版空对象。

export const Terrain = {
  // 0x4D / 77：雪堆。只有拿到雪铲后步行可清除。
  SNOW: 0x4d,

  // 0x56..0x5D：原版 ta.png 中带动画的水域/边缘；0x57..0x5A 明确承担潮汐方向。
  WATER_ANIMATED: 0x56,
  TIDE_UP: 0x57,
  TIDE_DOWN: 0x58,
  TIDE_LEFT: 0x59,
  TIDE_RIGHT: 0x5a,

  // 割草后原版会从这四种普通地面中选一种。
  GROUND_A: 0x5e,
  GROUND_B: 0x5f,
  GROUND_C: 0x90,
  GROUND_D: 0x91,

  ICE: 0x94,       // signed -108
  START: 0x95,     // signed -107，Bobby 出生点
  EXIT: 0x96,      // signed -106

  SHOP_DREAM: 0x97,
  SHOP_CLOUD9: 0x98,
  SHOP_SUPER_KEY: 0x99,
  SHOP_STEREO: 0x9a,
  SHOP_MUSIC: 0x9b,
  SHOP_SPEED_SHOES: 0x9c,
  SHOP_COIN_RADAR: 0x9d,
  SHOP_UNAVAILABLE: 0x9e,
  SHOVEL_PICKUP: 0x9f, // signed -97
  MOWER_PARKING: 0xa0,

  SPEED_SWITCH_A: 0xa1,
  SPEED_SWITCH_B: 0xa2,
  CAROUSEL_SWITCH_A: 0xa3,
  CAROUSEL_SWITCH_B: 0xa4,
  TIDE_SWITCH_A: 0xa5,
  TIDE_SWITCH_B: 0xa6,

  WIND_SWITCH_0_ON: 0xa7,
  WIND_SWITCH_0_OFF: 0xa8,
  WIND_SWITCH_1_ON: 0xa9,
  WIND_SWITCH_1_OFF: 0xaa,
  WIND_SWITCH_2_ON: 0xab,
  WIND_SWITCH_2_OFF: 0xac,
  WIND_SWITCH_3_ON: 0xad,
  WIND_SWITCH_3_OFF: 0xae,

  TRAP_ACTIVE: 0xaf,
  TRAP_INACTIVE: 0xb0,

  MIRROR_1: 0xb1,
  MIRROR_2: 0xb2,
  MIRROR_3: 0xb3,
  MIRROR_4: 0xb4,

  SPEED_UP: 0xb5,
  SPEED_DOWN: 0xb6,
  SPEED_LEFT: 0xb7,
  SPEED_RIGHT: 0xb8,

  CAROUSEL_1: 0xb9,
  CAROUSEL_2: 0xba,
  CAROUSEL_3: 0xbb,
  CAROUSEL_4: 0xbc,
  CAROUSEL_VERTICAL: 0xbd,
  CAROUSEL_HORIZONTAL: 0xbe,

  COLOR_YELLOW_SWITCH_A: 0xbf,
  COLOR_YELLOW_SWITCH_B: 0xc0,
  COLOR_PINK_SWITCH_A: 0xc1,
  COLOR_PINK_SWITCH_B: 0xc2,
  COLOR_YELLOW_BLOCK_ON: 0xc3,
  COLOR_YELLOW_BLOCK_OFF: 0xc4,
  COLOR_PINK_BLOCK_ON: 0xc5,
  COLOR_PINK_BLOCK_OFF: 0xc6,

  HIGH_GRASS: 0xc7,
  HIGH_GRASS_OBJECTIVE: 0xc8
} as const;

export const ObjectId = {
  CONSUMED_CARROT: 0xc9, // signed -55
  CARROT: 0xca,          // signed -54
  EGG_NEST_EMPTY: 0xcb,  // signed -53
  EGG_NEST_FILLED: 0xcc, // signed -52
  LOCK: 0xcd,            // signed -51
  BEANSTALK_TIP: 0xce,   // signed -50，正在向上生长的藤蔓顶端；成熟后仍可攀爬
  BEANSTALK: 0xce,       // 兼容旧代码的别名；语义同 BEANSTALK_TIP
  BEAN: 0xcf,            // signed -49

  WINDMILL_UP: 0xd0,     // signed -48；方向由原版 J()/P() 中 aZ=2 确认
  WINDMILL_DOWN: 0xd1,   // signed -47；aZ=3
  WINDMILL_LEFT: 0xd2,   // signed -46；aZ=0
  WINDMILL_RIGHT: 0xd3,  // signed -45；aZ=1

  PLANK: 0xd4,           // signed -44
  PLANK_CRUMBLING: 0xd5, // signed -43
  PLANK_FRAGMENT: 0xd6,  // signed -42，动画阶段

  DRAGON_HEAD_BASE: 0xd7, // signed -41；载入时扩展 D8/D9
  DRAGON_BODY: 0xd8,      // signed -40
  DRAGON_TAIL: 0xd9,      // signed -39；踩到触发喷火
  SANDMAN: 0xda,          // signed -38
  DREAM_MACHINE: 0xdb,    // signed -37
  MOWER: 0xdc,            // signed -36
  GAS: 0xdd,              // signed -35
  BEANSTALK_MID: 0xde,    // signed -34，藤蔓中段，可攀爬
  BEAN_FIELD: 0xdf,       // signed -33

  CLOUD_RED: 0xe0,        // signed -32，动态实体
  CLOUD_PURPLE: 0xe1,     // signed -31，动态实体
  CLOUD_GREEN: 0xe2,      // signed -30，动态实体
  ICE_BLOCK: 0xe3,        // signed -29
  ICE_MELT_1: 0xe4,
  ICE_MELT_2: 0xe5,
  ICE_MELT_3: 0xe6,
  BEAVER_BASE: 0xe7,      // signed -25；载入时向下展开 F7，组成 Beaver 两格角色
  DRAGON_NPC_BASE: 0xe7,  // 兼容旧错误命名，勿在新代码使用
  DRAGON_ANIM_1: 0xe8,
  DRAGON_ANIM_2: 0xe9,
  SANDMAN_BODY: 0xea,     // signed -22
  DREAM_MACHINE_BODY: 0xeb, // signed -21
  LEAF: 0xec,             // signed -20，动态荷叶
  CRUMBLY_ROCK: 0xed,     // signed -19
  BEANSTALK_BASE: 0xee,   // signed -18，魔豆田上形成的藤蔓根/基座，可攀爬
  BEANSTALK_TOP: 0xee,    // 兼容旧名称；原先命名不准确，实际是基座
  BEAN_SPROUT: 0xef,      // signed -17

  CLOUD_GRID_RED: 0xf0,
  CLOUD_GRID_PURPLE: 0xf1,
  CLOUD_GRID_GREEN: 0xf2,
  KITE: 0xf3,
  WHIRLWIND: 0xf4,
  LANDING: 0xf5,
  GOLDEN_CARROT: 0xf6,
  BEAVER_BODY: 0xf7,     // signed -9；E7 Beaver 的下半部分/展开格
  BEAVER: 0xf7,          // 兼容旧名称
  BONUS_COIN: 0xf8,

  FENCE_1: 0xf9,
  FENCE_2: 0xfa,
  FENCE_3: 0xfb,
  FENCE_4: 0xfc,
  FENCE_5: 0xfd,
  FENCE_6: 0xfe,
  EMPTY: 0xff
} as const;

export type Direction = 'left' | 'right' | 'up' | 'down';

export interface StepVector { dx: number; dy: number; }

export const DIRECTIONS: Record<Direction, StepVector> = {
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 }
};

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  left: 'right', right: 'left', up: 'down', down: 'up'
};

export const SPEED_TERRAIN_DIRECTION = new Map<number, Direction>([
  [Terrain.SPEED_LEFT, 'left'],
  [Terrain.SPEED_RIGHT, 'right'],
  [Terrain.SPEED_UP, 'up'],
  [Terrain.SPEED_DOWN, 'down']
]);

export const TIDE_TERRAIN_DIRECTION = new Map<number, Direction>([
  [Terrain.TIDE_UP, 'up'],
  [Terrain.TIDE_DOWN, 'down'],
  [Terrain.TIDE_LEFT, 'left'],
  [Terrain.TIDE_RIGHT, 'right']
]);

export const WINDMILL_DIRECTION = new Map<number, Direction>([
  [ObjectId.WINDMILL_UP, 'up'],
  [ObjectId.WINDMILL_DOWN, 'down'],
  [ObjectId.WINDMILL_LEFT, 'left'],
  [ObjectId.WINDMILL_RIGHT, 'right']
]);

export const DYNAMIC_OBJECT_IDS = new Set<number>([
  ObjectId.CLOUD_RED, ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GREEN, ObjectId.LEAF
]);

export const CLOUD_OBJECT_IDS = new Set<number>([
  ObjectId.CLOUD_RED, ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GREEN
]);

export const CLOUD_GRID_FOR_OBJECT = new Map<number, number>([
  [ObjectId.CLOUD_RED, ObjectId.CLOUD_GRID_RED],
  [ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GRID_PURPLE],
  [ObjectId.CLOUD_GREEN, ObjectId.CLOUD_GRID_GREEN]
]);

export function signedByte(id: number): number {
  return id > 127 ? id - 256 : id;
}

export function hexByte(id: number): string {
  return `0x${(id & 0xff).toString(16).padStart(2, '0').toUpperCase()}`;
}

export function directionFromDelta(dx: number, dy: number): Direction | null {
  if (dx === -1 && dy === 0) return 'left';
  if (dx === 1 && dy === 0) return 'right';
  if (dx === 0 && dy === -1) return 'up';
  if (dx === 0 && dy === 1) return 'down';
  return null;
}
