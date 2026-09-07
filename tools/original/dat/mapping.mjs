import { DecodedObject, DecodedTerrain } from "./semantic-ids.mjs";
import { tsAtlasCell } from "@bobby/model";

const TERRAIN_BY_DAT = new Map([
  [0x4d, DecodedTerrain.SNOW],
  [0x55, DecodedTerrain.WATER],
  [0x57, DecodedTerrain.TIDE_DOWN],
  [0x58, DecodedTerrain.TIDE_UP],
  [0x59, DecodedTerrain.TIDE_RIGHT],
  [0x5a, DecodedTerrain.TIDE_LEFT],
  [0x94, DecodedTerrain.ICE],
  [0x95, DecodedTerrain.START],
  [0x96, DecodedTerrain.EXIT],
  [0x97, DecodedTerrain.SHOP_DREAM],
  [0x98, DecodedTerrain.SHOP_CLOUD9],
  [0x99, DecodedTerrain.SHOP_SUPER_KEY],
  [0x9a, DecodedTerrain.SHOP_STEREO],
  [0x9b, DecodedTerrain.SHOP_MUSIC],
  [0x9c, DecodedTerrain.SHOP_SPEED_SHOES],
  [0x9d, DecodedTerrain.SHOP_COIN_RADAR],
  [0x9e, DecodedTerrain.SHOP_EMPTY],
  [0x9f, DecodedTerrain.SHOVEL_PICKUP],
  [0xa0, DecodedTerrain.MOWER_PARKING],
  [0xa1, DecodedTerrain.SPEED_SWITCH_PRESSED],
  [0xa2, DecodedTerrain.SPEED_SWITCH_RAISED],
  [0xa3, DecodedTerrain.CAROUSEL_SWITCH_PRESSED],
  [0xa4, DecodedTerrain.CAROUSEL_SWITCH_RAISED],
  [0xa5, DecodedTerrain.TIDE_SWITCH_PRESSED],
  [0xa6, DecodedTerrain.TIDE_SWITCH_RAISED],
  [0xa7, DecodedTerrain.WIND_SWITCH_0_ON],
  [0xa8, DecodedTerrain.WIND_SWITCH_0_OFF],
  [0xa9, DecodedTerrain.WIND_SWITCH_1_ON],
  [0xaa, DecodedTerrain.WIND_SWITCH_1_OFF],
  [0xab, DecodedTerrain.WIND_SWITCH_2_ON],
  [0xac, DecodedTerrain.WIND_SWITCH_2_OFF],
  [0xad, DecodedTerrain.WIND_SWITCH_3_ON],
  [0xae, DecodedTerrain.WIND_SWITCH_3_OFF],
  [0xaf, DecodedTerrain.TRAP_ACTIVE],
  [0xb0, DecodedTerrain.TRAP_INACTIVE],
  [0xb1, DecodedTerrain.MIRROR_1],
  [0xb2, DecodedTerrain.MIRROR_2],
  [0xb3, DecodedTerrain.MIRROR_3],
  [0xb4, DecodedTerrain.MIRROR_4],
  [0xb5, DecodedTerrain.SPEED_UP],
  [0xb6, DecodedTerrain.SPEED_DOWN],
  [0xb7, DecodedTerrain.SPEED_LEFT],
  [0xb8, DecodedTerrain.SPEED_RIGHT],
  [0xb9, DecodedTerrain.CAROUSEL_1],
  [0xba, DecodedTerrain.CAROUSEL_2],
  [0xbb, DecodedTerrain.CAROUSEL_3],
  [0xbc, DecodedTerrain.CAROUSEL_4],
  [0xbd, DecodedTerrain.CAROUSEL_VERTICAL],
  [0xbe, DecodedTerrain.CAROUSEL_HORIZONTAL],
  [0xbf, DecodedTerrain.COLOR_YELLOW_SWITCH_RAISED],
  [0xc0, DecodedTerrain.COLOR_YELLOW_SWITCH_PRESSED],
  [0xc1, DecodedTerrain.COLOR_PINK_SWITCH_RAISED],
  [0xc2, DecodedTerrain.COLOR_PINK_SWITCH_PRESSED],
  [0xc3, DecodedTerrain.COLOR_YELLOW_BLOCK_RAISED],
  [0xc4, DecodedTerrain.COLOR_YELLOW_BLOCK_LOWERED],
  [0xc5, DecodedTerrain.COLOR_PINK_BLOCK_RAISED],
  [0xc6, DecodedTerrain.COLOR_PINK_BLOCK_LOWERED],
  [0xc7, DecodedTerrain.HIGH_GRASS],
  [0xc8, DecodedTerrain.HIGH_GRASS_OBJECTIVE],
]);

const OBJECT_BY_DAT = new Map([
  [0xc9, DecodedObject.CONSUMED_CARROT],
  [0xca, DecodedObject.CARROT],
  [0xcb, DecodedObject.EGG_NEST_EMPTY],
  [0xcc, DecodedObject.EGG_NEST_FILLED],
  [0xcd, DecodedObject.LOCK],
  [0xce, DecodedObject.BEANSTALK_TIP],
  [0xcf, DecodedObject.BEAN],
  [0xd0, DecodedObject.WINDMILL_UP],
  [0xd1, DecodedObject.WINDMILL_DOWN],
  [0xd2, DecodedObject.WINDMILL_LEFT],
  [0xd3, DecodedObject.WINDMILL_RIGHT],
  [0xd4, DecodedObject.PLANK],
  [0xd5, DecodedObject.PLANK_CRUMBLING],
  [0xd6, DecodedObject.PLANK_FRAGMENT],
  [0xd7, DecodedObject.DRAGON_HEAD_BASE],
  [0xd8, DecodedObject.DRAGON_BODY],
  [0xd9, DecodedObject.DRAGON_TAIL],
  [0xda, DecodedObject.SANDMAN],
  [0xdb, DecodedObject.DREAM_MACHINE],
  [0xdc, DecodedObject.MOWER],
  [0xdd, DecodedObject.GAS],
  [0xde, DecodedObject.BEANSTALK_MID],
  [0xdf, DecodedObject.BEAN_FIELD],
  [0xe0, DecodedObject.CLOUD_RED],
  [0xe1, DecodedObject.CLOUD_PURPLE],
  [0xe2, DecodedObject.CLOUD_GREEN],
  [0xe3, DecodedObject.ICE_BLOCK],
  [0xe4, DecodedObject.ICE_MELT_1],
  [0xe5, DecodedObject.ICE_MELT_2],
  [0xe6, DecodedObject.ICE_MELT_3],
  [0xe7, DecodedObject.BEAVER_BASE],
  [0xe8, DecodedObject.DRAGON_ANIM_1],
  [0xe9, DecodedObject.DRAGON_ANIM_2],
  [0xea, DecodedObject.SANDMAN_BODY],
  [0xeb, DecodedObject.DREAM_MACHINE_BODY],
  [0xec, DecodedObject.LEAF],
  [0xed, DecodedObject.CRUMBLY_ROCK],
  [0xee, DecodedObject.BEANSTALK_BASE],
  [0xef, DecodedObject.BEAN_SPROUT],
  [0xf0, DecodedObject.CLOUD_GRID_RED],
  [0xf1, DecodedObject.CLOUD_GRID_PURPLE],
  [0xf2, DecodedObject.CLOUD_GRID_GREEN],
  [0xf3, DecodedObject.KITE],
  [0xf4, DecodedObject.WHIRLWIND],
  [0xf5, DecodedObject.LANDING],
  [0xf6, DecodedObject.GOLDEN_CARROT],
  [0xf7, DecodedObject.BEAVER_BODY],
  [0xf8, DecodedObject.BONUS_COIN],
  [0xf9, DecodedObject.FENCE_1],
  [0xfa, DecodedObject.FENCE_2],
  [0xfb, DecodedObject.FENCE_3],
  [0xfc, DecodedObject.FENCE_4],
  [0xfd, DecodedObject.FENCE_5],
  [0xfe, DecodedObject.FENCE_6],
  [0xff, DecodedObject.EMPTY],
]);

const DAT_BY_TERRAIN = reverse(TERRAIN_BY_DAT);
const DAT_BY_OBJECT = reverse(OBJECT_BY_DAT);
const hex = (value) => `0x${value.toString(16).padStart(2, "0").toUpperCase()}`;

export function decodeDatTerrain(byte) {
  const code = normalizeByte(byte);
  const coordinate = tsCoordinateFromByte(code);
  const row = Math.floor(code / 16) + 1;
  const column = (code % 16) + 1;
  return `${coordinate}:${tsAtlasCell(row, column).name}`;
}

export function encodeDatTerrain(type) {
  const taggedCoordinate = /^ts-(\d+)-(\d+):[a-z0-9-]+$/.exec(type);
  if (taggedCoordinate)
    return byteFromTsCoordinate(
      Number(taggedCoordinate[1]),
      Number(taggedCoordinate[2]),
    );
  const known = DAT_BY_TERRAIN.get(type);
  if (known !== undefined) return known;
  const coordinate = /^ts-(\d+)-(\d+)$/.exec(type);
  if (coordinate)
    return byteFromTsCoordinate(Number(coordinate[1]), Number(coordinate[2]));
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
  const row = Math.floor(code / 16) + 1;
  const column = (code % 16) + 1;
  return `${tsCoordinateFromByte(code)}:${tsAtlasCell(row, column).name}`;
}

export function encodeDatObject(type) {
  const taggedCoordinate = /^ts-(\d+)-(\d+):[a-z0-9-]+$/.exec(type);
  if (taggedCoordinate)
    return byteFromTsCoordinate(
      Number(taggedCoordinate[1]),
      Number(taggedCoordinate[2]),
    );
  const known = DAT_BY_OBJECT.get(type);
  if (known !== undefined) return known;
  throw new Error(`No original DAT object mapping for semantic type: ${type}`);
}

/** decoded 标签中的坐标是 DAT byte 的无损身份，后缀只用于人工审阅。 */
export function decodedAtlasCoordinate(type) {
  const match = /^ts-(\d+)-(\d+):[a-z0-9-]+$/.exec(type);
  return match ? `ts-${match[1]}-${match[2]}` : undefined;
}

/** 返回 terrain byte 对应的原版细分语义，供唯一 Adapter 边界消费。 */
export function decodedTerrainSourceSemantic(type) {
  const coordinate = decodedAtlasCoordinate(type);
  if (!coordinate) return type;
  const code = encodeDatTerrain(type);
  return TERRAIN_BY_DAT.get(code) ?? type.slice(type.indexOf(":") + 1);
}

/** 返回 object byte 对应的原版细分语义，供唯一 Adapter 边界消费。 */
export function decodedObjectSourceSemantic(type) {
  const coordinate = decodedAtlasCoordinate(type);
  if (!coordinate) return type;
  const code = encodeDatObject(type);
  return OBJECT_BY_DAT.get(code) ?? "unknown-object";
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
