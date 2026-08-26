import {
  ObjectId,
  Terrain,
  type ObjectType,
  type TerrainType,
} from "@bobby/model";

const TERRAIN_BY_DAT = new Map<number, TerrainType>([
  [0x4d, Terrain.SNOW],
  [0x55, Terrain.WATER],
  [0x56, Terrain.WATER_ANIMATED],
  [0x57, Terrain.TIDE_UP],
  [0x58, Terrain.TIDE_DOWN],
  [0x59, Terrain.TIDE_LEFT],
  [0x5a, Terrain.TIDE_RIGHT],
  [0x5b, Terrain.WATER_VARIANT_1],
  [0x5c, Terrain.WATER_VARIANT_2],
  [0x5d, Terrain.WATER_VARIANT_3],
  [0x5e, Terrain.GROUND_A],
  [0x5f, Terrain.GROUND_B],
  [0x7c, Terrain.SHOVEL_CLEARED_GROUND],
  [0x90, Terrain.GROUND_C],
  [0x91, Terrain.GROUND_D],
  [0x94, Terrain.ICE],
  [0x95, Terrain.START],
  [0x96, Terrain.EXIT],
  [0x97, Terrain.SHOP_DREAM],
  [0x98, Terrain.SHOP_CLOUD9],
  [0x99, Terrain.SHOP_SUPER_KEY],
  [0x9a, Terrain.SHOP_STEREO],
  [0x9b, Terrain.SHOP_MUSIC],
  [0x9c, Terrain.SHOP_SPEED_SHOES],
  [0x9d, Terrain.SHOP_COIN_RADAR],
  [0x9e, Terrain.SHOP_UNAVAILABLE],
  [0x9f, Terrain.SHOVEL_PICKUP],
  [0xa0, Terrain.MOWER_PARKING],
  [0xa1, Terrain.SPEED_SWITCH_PRESSED],
  [0xa2, Terrain.SPEED_SWITCH_RAISED],
  [0xa3, Terrain.CAROUSEL_SWITCH_RAISED],
  [0xa4, Terrain.CAROUSEL_SWITCH_PRESSED],
  [0xa5, Terrain.TIDE_SWITCH_RAISED],
  [0xa6, Terrain.TIDE_SWITCH_PRESSED],
  [0xa7, Terrain.WIND_SWITCH_0_ON],
  [0xa8, Terrain.WIND_SWITCH_0_OFF],
  [0xa9, Terrain.WIND_SWITCH_1_ON],
  [0xaa, Terrain.WIND_SWITCH_1_OFF],
  [0xab, Terrain.WIND_SWITCH_2_ON],
  [0xac, Terrain.WIND_SWITCH_2_OFF],
  [0xad, Terrain.WIND_SWITCH_3_ON],
  [0xae, Terrain.WIND_SWITCH_3_OFF],
  [0xaf, Terrain.TRAP_ACTIVE],
  [0xb0, Terrain.TRAP_INACTIVE],
  [0xb1, Terrain.MIRROR_1],
  [0xb2, Terrain.MIRROR_2],
  [0xb3, Terrain.MIRROR_3],
  [0xb4, Terrain.MIRROR_4],
  [0xb5, Terrain.SPEED_UP],
  [0xb6, Terrain.SPEED_DOWN],
  [0xb7, Terrain.SPEED_LEFT],
  [0xb8, Terrain.SPEED_RIGHT],
  [0xb9, Terrain.CAROUSEL_1],
  [0xba, Terrain.CAROUSEL_2],
  [0xbb, Terrain.CAROUSEL_3],
  [0xbc, Terrain.CAROUSEL_4],
  [0xbd, Terrain.CAROUSEL_VERTICAL],
  [0xbe, Terrain.CAROUSEL_HORIZONTAL],
  [0xbf, Terrain.COLOR_YELLOW_SWITCH_RAISED],
  [0xc0, Terrain.COLOR_YELLOW_SWITCH_PRESSED],
  [0xc1, Terrain.COLOR_PINK_SWITCH_RAISED],
  [0xc2, Terrain.COLOR_PINK_SWITCH_PRESSED],
  [0xc3, Terrain.COLOR_YELLOW_BLOCK_RAISED],
  [0xc4, Terrain.COLOR_YELLOW_BLOCK_LOWERED],
  [0xc5, Terrain.COLOR_PINK_BLOCK_RAISED],
  [0xc6, Terrain.COLOR_PINK_BLOCK_LOWERED],
  [0xc7, Terrain.HIGH_GRASS],
  [0xc8, Terrain.HIGH_GRASS_OBJECTIVE],
]);

const OBJECT_BY_DAT = new Map<number, ObjectType>([
  [0xc9, ObjectId.CONSUMED_CARROT],
  [0xca, ObjectId.CARROT],
  [0xcb, ObjectId.EGG_NEST_EMPTY],
  [0xcc, ObjectId.EGG_NEST_FILLED],
  [0xcd, ObjectId.LOCK],
  [0xce, ObjectId.BEANSTALK_TIP],
  [0xcf, ObjectId.BEAN],
  [0xd0, ObjectId.WINDMILL_UP],
  [0xd1, ObjectId.WINDMILL_DOWN],
  [0xd2, ObjectId.WINDMILL_LEFT],
  [0xd3, ObjectId.WINDMILL_RIGHT],
  [0xd4, ObjectId.PLANK],
  [0xd5, ObjectId.PLANK_CRUMBLING],
  [0xd6, ObjectId.PLANK_FRAGMENT],
  [0xd7, ObjectId.DRAGON_HEAD_BASE],
  [0xd8, ObjectId.DRAGON_BODY],
  [0xd9, ObjectId.DRAGON_TAIL],
  [0xda, ObjectId.SANDMAN],
  [0xdb, ObjectId.DREAM_MACHINE],
  [0xdc, ObjectId.MOWER],
  [0xdd, ObjectId.GAS],
  [0xde, ObjectId.BEANSTALK_MID],
  [0xdf, ObjectId.BEAN_FIELD],
  [0xe0, ObjectId.CLOUD_RED],
  [0xe1, ObjectId.CLOUD_PURPLE],
  [0xe2, ObjectId.CLOUD_GREEN],
  [0xe3, ObjectId.ICE_BLOCK],
  [0xe4, ObjectId.ICE_MELT_1],
  [0xe5, ObjectId.ICE_MELT_2],
  [0xe6, ObjectId.ICE_MELT_3],
  [0xe7, ObjectId.BEAVER_BASE],
  [0xe8, ObjectId.DRAGON_ANIM_1],
  [0xe9, ObjectId.DRAGON_ANIM_2],
  [0xea, ObjectId.SANDMAN_BODY],
  [0xeb, ObjectId.DREAM_MACHINE_BODY],
  [0xec, ObjectId.LEAF],
  [0xed, ObjectId.CRUMBLY_ROCK],
  [0xee, ObjectId.BEANSTALK_BASE],
  [0xef, ObjectId.BEAN_SPROUT],
  [0xf0, ObjectId.CLOUD_GRID_RED],
  [0xf1, ObjectId.CLOUD_GRID_PURPLE],
  [0xf2, ObjectId.CLOUD_GRID_GREEN],
  [0xf3, ObjectId.KITE],
  [0xf4, ObjectId.WHIRLWIND],
  [0xf5, ObjectId.LANDING],
  [0xf6, ObjectId.GOLDEN_CARROT],
  [0xf7, ObjectId.BEAVER_BODY],
  [0xf8, ObjectId.BONUS_COIN],
  [0xf9, ObjectId.FENCE_1],
  [0xfa, ObjectId.FENCE_2],
  [0xfb, ObjectId.FENCE_3],
  [0xfc, ObjectId.FENCE_4],
  [0xfd, ObjectId.FENCE_5],
  [0xfe, ObjectId.FENCE_6],
  [0xff, ObjectId.EMPTY],
]);
const DAT_BY_TERRAIN = reverse(TERRAIN_BY_DAT);
const DAT_BY_OBJECT = reverse(OBJECT_BY_DAT);

export interface DatSourceMetadata {
  datHexIds: string[];
  confidence: "confirmed" | "inferred";
}
const hex = (value: number): string =>
  `0x${value.toString(16).padStart(2, "0").toUpperCase()}`;

export function decodeDatTerrain(byte: number): TerrainType {
  const code = normalizeByte(byte);
  const known = TERRAIN_BY_DAT.get(code);
  if (known) return known;
  if (code >= 0x60 && code <= 0x93)
    return `walkable-variant-${String(code - 0x60 + 1).padStart(2, "0")}` as TerrainType;
  return `background-variant-${String(code + 1).padStart(3, "0")}` as TerrainType;
}
export function encodeDatTerrain(type: TerrainType): number {
  const known = DAT_BY_TERRAIN.get(type);
  if (known !== undefined) return known;
  const walkable = /^walkable-variant-(\d{2})$/.exec(type);
  if (walkable) return normalizeByte(0x60 + Number(walkable[1]) - 1);
  const background = /^background-variant-(\d{3})$/.exec(type);
  if (background) return normalizeByte(Number(background[1]) - 1);
  throw new Error(`No original DAT terrain mapping for semantic type: ${type}`);
}
export function decodeDatObject(byte: number): ObjectType {
  const code = normalizeByte(byte);
  return (
    OBJECT_BY_DAT.get(code) ??
    (`object-variant-${String(code + 1).padStart(3, "0")}` as ObjectType)
  );
}
export function encodeDatObject(type: ObjectType): number {
  const known = DAT_BY_OBJECT.get(type);
  if (known !== undefined) return known;
  const variant = /^object-variant-(\d{3})$/.exec(type);
  if (variant) return normalizeByte(Number(variant[1]) - 1);
  throw new Error(`No original DAT object mapping for semantic type: ${type}`);
}
export function datSourceForTerrain(
  type: TerrainType,
): DatSourceMetadata | undefined {
  const known = DAT_BY_TERRAIN.get(type);
  if (known !== undefined)
    return { datHexIds: [hex(known)], confidence: "confirmed" };
  try {
    return { datHexIds: [hex(encodeDatTerrain(type))], confidence: "inferred" };
  } catch {
    return undefined;
  }
}
export function datSourceForObject(
  type: ObjectType,
): DatSourceMetadata | undefined {
  const known = DAT_BY_OBJECT.get(type);
  if (known !== undefined)
    return { datHexIds: [hex(known)], confidence: "confirmed" };
  try {
    return { datHexIds: [hex(encodeDatObject(type))], confidence: "inferred" };
  } catch {
    return undefined;
  }
}
function reverse<T extends string>(map: Map<number, T>): Map<T, number> {
  return new Map(Array.from(map, ([code, type]) => [type, code]));
}
function normalizeByte(value: number): number {
  if (!Number.isFinite(value))
    throw new Error(`Invalid DAT byte: ${String(value)}`);
  return Math.min(255, Math.max(0, Math.trunc(value))) & 0xff;
}
