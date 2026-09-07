import { LegacyObject, LegacyTerrain } from "./semantic-ids.mjs";

const TERRAIN_BY_DAT = new Map([
  [0x4d, LegacyTerrain.SNOW],
  [0x55, LegacyTerrain.WATER],
  [0x56, LegacyTerrain.WATER_ANIMATED],
  [0x57, LegacyTerrain.TIDE_DOWN],
  [0x58, LegacyTerrain.TIDE_UP],
  [0x59, LegacyTerrain.TIDE_RIGHT],
  [0x5a, LegacyTerrain.TIDE_LEFT],
  [0x5b, LegacyTerrain.WATER_VARIANT_1],
  [0x5c, LegacyTerrain.WATER_VARIANT_2],
  [0x5d, LegacyTerrain.WATER_VARIANT_3],
  [0x5e, LegacyTerrain.GROUND_A],
  [0x5f, LegacyTerrain.GROUND_B],
  [0x7c, LegacyTerrain.SHOVEL_CLEARED_GROUND],
  [0x90, LegacyTerrain.GROUND_C],
  [0x91, LegacyTerrain.GROUND_D],
  [0x94, LegacyTerrain.ICE],
  [0x95, LegacyTerrain.START],
  [0x96, LegacyTerrain.EXIT],
  [0x97, LegacyTerrain.SHOP_DREAM],
  [0x98, LegacyTerrain.SHOP_CLOUD9],
  [0x99, LegacyTerrain.SHOP_SUPER_KEY],
  [0x9a, LegacyTerrain.SHOP_STEREO],
  [0x9b, LegacyTerrain.SHOP_MUSIC],
  [0x9c, LegacyTerrain.SHOP_SPEED_SHOES],
  [0x9d, LegacyTerrain.SHOP_COIN_RADAR],
  [0x9e, LegacyTerrain.SHOP_UNAVAILABLE],
  [0x9f, LegacyTerrain.SHOVEL_PICKUP],
  [0xa0, LegacyTerrain.MOWER_PARKING],
  [0xa1, LegacyTerrain.SPEED_SWITCH_PRESSED],
  [0xa2, LegacyTerrain.SPEED_SWITCH_RAISED],
  [0xa3, LegacyTerrain.CAROUSEL_SWITCH_PRESSED],
  [0xa4, LegacyTerrain.CAROUSEL_SWITCH_RAISED],
  [0xa5, LegacyTerrain.TIDE_SWITCH_PRESSED],
  [0xa6, LegacyTerrain.TIDE_SWITCH_RAISED],
  [0xa7, LegacyTerrain.WIND_SWITCH_0_ON],
  [0xa8, LegacyTerrain.WIND_SWITCH_0_OFF],
  [0xa9, LegacyTerrain.WIND_SWITCH_1_ON],
  [0xaa, LegacyTerrain.WIND_SWITCH_1_OFF],
  [0xab, LegacyTerrain.WIND_SWITCH_2_ON],
  [0xac, LegacyTerrain.WIND_SWITCH_2_OFF],
  [0xad, LegacyTerrain.WIND_SWITCH_3_ON],
  [0xae, LegacyTerrain.WIND_SWITCH_3_OFF],
  [0xaf, LegacyTerrain.TRAP_ACTIVE],
  [0xb0, LegacyTerrain.TRAP_INACTIVE],
  [0xb1, LegacyTerrain.MIRROR_1],
  [0xb2, LegacyTerrain.MIRROR_2],
  [0xb3, LegacyTerrain.MIRROR_3],
  [0xb4, LegacyTerrain.MIRROR_4],
  [0xb5, LegacyTerrain.SPEED_UP],
  [0xb6, LegacyTerrain.SPEED_DOWN],
  [0xb7, LegacyTerrain.SPEED_LEFT],
  [0xb8, LegacyTerrain.SPEED_RIGHT],
  [0xb9, LegacyTerrain.CAROUSEL_1],
  [0xba, LegacyTerrain.CAROUSEL_2],
  [0xbb, LegacyTerrain.CAROUSEL_3],
  [0xbc, LegacyTerrain.CAROUSEL_4],
  [0xbd, LegacyTerrain.CAROUSEL_VERTICAL],
  [0xbe, LegacyTerrain.CAROUSEL_HORIZONTAL],
  [0xbf, LegacyTerrain.COLOR_YELLOW_SWITCH_RAISED],
  [0xc0, LegacyTerrain.COLOR_YELLOW_SWITCH_PRESSED],
  [0xc1, LegacyTerrain.COLOR_PINK_SWITCH_RAISED],
  [0xc2, LegacyTerrain.COLOR_PINK_SWITCH_PRESSED],
  [0xc3, LegacyTerrain.COLOR_YELLOW_BLOCK_RAISED],
  [0xc4, LegacyTerrain.COLOR_YELLOW_BLOCK_LOWERED],
  [0xc5, LegacyTerrain.COLOR_PINK_BLOCK_RAISED],
  [0xc6, LegacyTerrain.COLOR_PINK_BLOCK_LOWERED],
  [0xc7, LegacyTerrain.HIGH_GRASS],
  [0xc8, LegacyTerrain.HIGH_GRASS_OBJECTIVE],
]);

const OBJECT_BY_DAT = new Map([
  [0xc9, LegacyObject.CONSUMED_CARROT],
  [0xca, LegacyObject.CARROT],
  [0xcb, LegacyObject.EGG_NEST_EMPTY],
  [0xcc, LegacyObject.EGG_NEST_FILLED],
  [0xcd, LegacyObject.LOCK],
  [0xce, LegacyObject.BEANSTALK_TIP],
  [0xcf, LegacyObject.BEAN],
  [0xd0, LegacyObject.WINDMILL_UP],
  [0xd1, LegacyObject.WINDMILL_DOWN],
  [0xd2, LegacyObject.WINDMILL_LEFT],
  [0xd3, LegacyObject.WINDMILL_RIGHT],
  [0xd4, LegacyObject.PLANK],
  [0xd5, LegacyObject.PLANK_CRUMBLING],
  [0xd6, LegacyObject.PLANK_FRAGMENT],
  [0xd7, LegacyObject.DRAGON_HEAD_BASE],
  [0xd8, LegacyObject.DRAGON_BODY],
  [0xd9, LegacyObject.DRAGON_TAIL],
  [0xda, LegacyObject.SANDMAN],
  [0xdb, LegacyObject.DREAM_MACHINE],
  [0xdc, LegacyObject.MOWER],
  [0xdd, LegacyObject.GAS],
  [0xde, LegacyObject.BEANSTALK_MID],
  [0xdf, LegacyObject.BEAN_FIELD],
  [0xe0, LegacyObject.CLOUD_RED],
  [0xe1, LegacyObject.CLOUD_PURPLE],
  [0xe2, LegacyObject.CLOUD_GREEN],
  [0xe3, LegacyObject.ICE_BLOCK],
  [0xe4, LegacyObject.ICE_MELT_1],
  [0xe5, LegacyObject.ICE_MELT_2],
  [0xe6, LegacyObject.ICE_MELT_3],
  [0xe7, LegacyObject.BEAVER_BASE],
  [0xe8, LegacyObject.DRAGON_ANIM_1],
  [0xe9, LegacyObject.DRAGON_ANIM_2],
  [0xea, LegacyObject.SANDMAN_BODY],
  [0xeb, LegacyObject.DREAM_MACHINE_BODY],
  [0xec, LegacyObject.LEAF],
  [0xed, LegacyObject.CRUMBLY_ROCK],
  [0xee, LegacyObject.BEANSTALK_BASE],
  [0xef, LegacyObject.BEAN_SPROUT],
  [0xf0, LegacyObject.CLOUD_GRID_RED],
  [0xf1, LegacyObject.CLOUD_GRID_PURPLE],
  [0xf2, LegacyObject.CLOUD_GRID_GREEN],
  [0xf3, LegacyObject.KITE],
  [0xf4, LegacyObject.WHIRLWIND],
  [0xf5, LegacyObject.LANDING],
  [0xf6, LegacyObject.GOLDEN_CARROT],
  [0xf7, LegacyObject.BEAVER_BODY],
  [0xf8, LegacyObject.BONUS_COIN],
  [0xf9, LegacyObject.FENCE_1],
  [0xfa, LegacyObject.FENCE_2],
  [0xfb, LegacyObject.FENCE_3],
  [0xfc, LegacyObject.FENCE_4],
  [0xfd, LegacyObject.FENCE_5],
  [0xfe, LegacyObject.FENCE_6],
  [0xff, LegacyObject.EMPTY],
]);

const DAT_BY_TERRAIN = reverse(TERRAIN_BY_DAT);
const DAT_BY_OBJECT = reverse(OBJECT_BY_DAT);
const hex = (value) => `0x${value.toString(16).padStart(2, "0").toUpperCase()}`;

export function decodeDatTerrain(byte) {
  const code = normalizeByte(byte);
  const known = TERRAIN_BY_DAT.get(code);
  if (known) return known;
  return tsCoordinateFromByte(code);
}

export function encodeDatTerrain(type) {
  const known = DAT_BY_TERRAIN.get(type);
  if (known !== undefined) return known;
  const coordinate = /^ts-(\d+)-(\d+)$/.exec(type);
  if (coordinate)
    return byteFromTsCoordinate(Number(coordinate[1]), Number(coordinate[2]));
  const walkable = /^walkable-variant-(\d{2})$/.exec(type);
  if (walkable) return normalizeByte(0x60 + Number(walkable[1]) - 1);
  const background = /^background-variant-(\d{3})$/.exec(type);
  if (background) return normalizeByte(Number(background[1]) - 1);
  throw new Error(`No original DAT terrain mapping for semantic type: ${type}`);
}

function tsCoordinateFromByte(byte) {
  return `ts-${Math.floor(byte / 16) + 1}-${(byte % 16) + 1}`;
}

function byteFromTsCoordinate(row, column) {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(column) ||
    row < 1 ||
    row > 16 ||
    column < 1 ||
    column > 16
  )
    throw new Error(`Invalid ts.png coordinate: ${row},${column}`);
  return (row - 1) * 16 + column - 1;
}

export function decodeDatObject(byte) {
  const code = normalizeByte(byte);
  return (
    OBJECT_BY_DAT.get(code) ??
    `object-variant-${String(code + 1).padStart(3, "0")}`
  );
}

export function encodeDatObject(type) {
  const known = DAT_BY_OBJECT.get(type);
  if (known !== undefined) return known;
  const variant = /^object-variant-(\d{3})$/.exec(type);
  if (variant) return normalizeByte(Number(variant[1]) - 1);
  throw new Error(`No original DAT object mapping for semantic type: ${type}`);
}

export function datSourceForTerrain(type) {
  const known = DAT_BY_TERRAIN.get(type);
  if (known !== undefined)
    return { datHexIds: [hex(known)], confidence: "confirmed" };
  try {
    return { datHexIds: [hex(encodeDatTerrain(type))], confidence: "inferred" };
  } catch {
    return undefined;
  }
}

export function datSourceForObject(type) {
  const known = DAT_BY_OBJECT.get(type);
  if (known !== undefined)
    return { datHexIds: [hex(known)], confidence: "confirmed" };
  try {
    return { datHexIds: [hex(encodeDatObject(type))], confidence: "inferred" };
  } catch {
    return undefined;
  }
}

function reverse(map) {
  return new Map(Array.from(map, ([code, type]) => [type, code]));
}

function normalizeByte(value) {
  if (!Number.isFinite(value))
    throw new Error(`Invalid DAT byte: ${String(value)}`);
  return Math.min(255, Math.max(0, Math.trunc(value))) & 0xff;
}
