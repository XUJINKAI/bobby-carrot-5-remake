import {
  DYNAMIC_OBJECT_IDS,
  ObjectId,
  Terrain,
  type ObjectType,
  type TerrainType
} from '@bobby/engine';
import type { EditorLevel } from './level.js';
import { normalizeEditorLevel } from './level.js';

const MAGIC = new Uint8Array([0x42, 0x43, 0x35, 0x52]); // BC5R
const SHARE_VERSION = 1;

const TERRAIN_BY_DAT = new Map<number, TerrainType>([
  [0x4d, Terrain.SNOW],
  [0x55, Terrain.WATER], [0x56, Terrain.WATER_ANIMATED],
  [0x57, Terrain.TIDE_UP], [0x58, Terrain.TIDE_DOWN], [0x59, Terrain.TIDE_LEFT], [0x5a, Terrain.TIDE_RIGHT],
  [0x5b, Terrain.WATER_VARIANT_1], [0x5c, Terrain.WATER_VARIANT_2], [0x5d, Terrain.WATER_VARIANT_3],
  [0x5e, Terrain.GROUND_A], [0x5f, Terrain.GROUND_B], [0x7c, Terrain.SHOVEL_CLEARED_GROUND],
  [0x90, Terrain.GROUND_C], [0x91, Terrain.GROUND_D], [0x94, Terrain.ICE], [0x95, Terrain.START], [0x96, Terrain.EXIT],
  [0x97, Terrain.SHOP_DREAM], [0x98, Terrain.SHOP_CLOUD9], [0x99, Terrain.SHOP_SUPER_KEY], [0x9a, Terrain.SHOP_STEREO],
  [0x9b, Terrain.SHOP_MUSIC], [0x9c, Terrain.SHOP_SPEED_SHOES], [0x9d, Terrain.SHOP_COIN_RADAR], [0x9e, Terrain.SHOP_UNAVAILABLE],
  [0x9f, Terrain.SHOVEL_PICKUP], [0xa0, Terrain.MOWER_PARKING],
  [0xa1, Terrain.SPEED_SWITCH_PRESSED], [0xa2, Terrain.SPEED_SWITCH_RAISED],
  [0xa3, Terrain.CAROUSEL_SWITCH_RAISED], [0xa4, Terrain.CAROUSEL_SWITCH_PRESSED],
  [0xa5, Terrain.TIDE_SWITCH_RAISED], [0xa6, Terrain.TIDE_SWITCH_PRESSED],
  [0xa7, Terrain.WIND_SWITCH_0_ON], [0xa8, Terrain.WIND_SWITCH_0_OFF], [0xa9, Terrain.WIND_SWITCH_1_ON], [0xaa, Terrain.WIND_SWITCH_1_OFF],
  [0xab, Terrain.WIND_SWITCH_2_ON], [0xac, Terrain.WIND_SWITCH_2_OFF], [0xad, Terrain.WIND_SWITCH_3_ON], [0xae, Terrain.WIND_SWITCH_3_OFF],
  [0xaf, Terrain.TRAP_ACTIVE], [0xb0, Terrain.TRAP_INACTIVE],
  [0xb1, Terrain.MIRROR_1], [0xb2, Terrain.MIRROR_2], [0xb3, Terrain.MIRROR_3], [0xb4, Terrain.MIRROR_4],
  [0xb5, Terrain.SPEED_UP], [0xb6, Terrain.SPEED_DOWN], [0xb7, Terrain.SPEED_LEFT], [0xb8, Terrain.SPEED_RIGHT],
  [0xb9, Terrain.CAROUSEL_1], [0xba, Terrain.CAROUSEL_2], [0xbb, Terrain.CAROUSEL_3], [0xbc, Terrain.CAROUSEL_4],
  [0xbd, Terrain.CAROUSEL_VERTICAL], [0xbe, Terrain.CAROUSEL_HORIZONTAL],
  [0xbf, Terrain.COLOR_YELLOW_SWITCH_RAISED], [0xc0, Terrain.COLOR_YELLOW_SWITCH_PRESSED],
  [0xc1, Terrain.COLOR_PINK_SWITCH_RAISED], [0xc2, Terrain.COLOR_PINK_SWITCH_PRESSED],
  [0xc3, Terrain.COLOR_YELLOW_BLOCK_RAISED], [0xc4, Terrain.COLOR_YELLOW_BLOCK_LOWERED],
  [0xc5, Terrain.COLOR_PINK_BLOCK_RAISED], [0xc6, Terrain.COLOR_PINK_BLOCK_LOWERED],
  [0xc7, Terrain.HIGH_GRASS], [0xc8, Terrain.HIGH_GRASS_OBJECTIVE]
]);

const OBJECT_BY_DAT = new Map<number, ObjectType>([
  [0xc9, ObjectId.CONSUMED_CARROT], [0xca, ObjectId.CARROT], [0xcb, ObjectId.EGG_NEST_EMPTY], [0xcc, ObjectId.EGG_NEST_FILLED], [0xcd, ObjectId.LOCK],
  [0xce, ObjectId.BEANSTALK_TIP], [0xcf, ObjectId.BEAN], [0xd0, ObjectId.WINDMILL_UP], [0xd1, ObjectId.WINDMILL_DOWN], [0xd2, ObjectId.WINDMILL_LEFT], [0xd3, ObjectId.WINDMILL_RIGHT],
  [0xd4, ObjectId.PLANK], [0xd5, ObjectId.PLANK_CRUMBLING], [0xd6, ObjectId.PLANK_FRAGMENT], [0xd7, ObjectId.DRAGON_HEAD_BASE], [0xd8, ObjectId.DRAGON_BODY], [0xd9, ObjectId.DRAGON_TAIL],
  [0xda, ObjectId.SANDMAN], [0xdb, ObjectId.DREAM_MACHINE], [0xdc, ObjectId.MOWER], [0xdd, ObjectId.GAS], [0xde, ObjectId.BEANSTALK_MID], [0xdf, ObjectId.BEAN_FIELD],
  [0xe0, ObjectId.CLOUD_RED], [0xe1, ObjectId.CLOUD_PURPLE], [0xe2, ObjectId.CLOUD_GREEN], [0xe3, ObjectId.ICE_BLOCK], [0xe4, ObjectId.ICE_MELT_1], [0xe5, ObjectId.ICE_MELT_2], [0xe6, ObjectId.ICE_MELT_3],
  [0xe7, ObjectId.BEAVER_BASE], [0xe8, ObjectId.DRAGON_ANIM_1], [0xe9, ObjectId.DRAGON_ANIM_2], [0xea, ObjectId.SANDMAN_BODY], [0xeb, ObjectId.DREAM_MACHINE_BODY], [0xec, ObjectId.LEAF],
  [0xed, ObjectId.CRUMBLY_ROCK], [0xee, ObjectId.BEANSTALK_BASE], [0xef, ObjectId.BEAN_SPROUT], [0xf0, ObjectId.CLOUD_GRID_RED], [0xf1, ObjectId.CLOUD_GRID_PURPLE], [0xf2, ObjectId.CLOUD_GRID_GREEN],
  [0xf3, ObjectId.KITE], [0xf4, ObjectId.WHIRLWIND], [0xf5, ObjectId.LANDING], [0xf6, ObjectId.GOLDEN_CARROT], [0xf7, ObjectId.BEAVER_BODY], [0xf8, ObjectId.BONUS_COIN],
  [0xf9, ObjectId.FENCE_1], [0xfa, ObjectId.FENCE_2], [0xfb, ObjectId.FENCE_3], [0xfc, ObjectId.FENCE_4], [0xfd, ObjectId.FENCE_5], [0xfe, ObjectId.FENCE_6], [0xff, ObjectId.EMPTY]
]);

const DAT_BY_TERRAIN = reverse(TERRAIN_BY_DAT);
const DAT_BY_OBJECT = reverse(OBJECT_BY_DAT);

interface LegacyCompactLevel {
  v: 2;
  n: string;
  a?: string;
  d?: string;
  w: number;
  h: number;
  t: Array<TerrainType | number>;
  o: Array<ObjectType | number>;
}

/**
 * URL 分享格式：bc5r metadata envelope + 原版 DAT level record -> deflate-raw -> base64url。
 * d. 表示压缩后的二进制分享；r. 是浏览器不支持 CompressionStream 时的 raw binary 回退。
 * decode 继续兼容旧 z./j. semantic JSON 链接。
 */
export async function encodeShareLevel(level: EditorLevel): Promise<string> {
  const raw = encodeShareBinary(normalizeEditorLevel(level));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const compressed = await transformBytes(raw, new CompressionStream('deflate-raw'));
      if (compressed.length < raw.length) return `d.${base64UrlEncode(compressed)}`;
    } catch {
      // 某些旧浏览器暴露 CompressionStream 但不支持 deflate-raw。
    }
  }
  return `r.${base64UrlEncode(raw)}`;
}

export async function decodeShareLevel(encoded: string): Promise<EditorLevel> {
  const value = encoded.trim();
  const dot = value.indexOf('.');
  if (dot <= 0) throw new Error('未知的分享地图编码');
  const type = value.slice(0, dot);
  let bytes = base64UrlDecode(value.slice(dot + 1));

  if (type === 'd') {
    if (typeof DecompressionStream === 'undefined') throw new Error('当前浏览器不支持解压此分享地图');
    bytes = await transformBytes(bytes, new DecompressionStream('deflate-raw'));
    return decodeShareBinary(bytes);
  }
  if (type === 'r') return decodeShareBinary(bytes);

  // v0.1 兼容：compact semantic JSON -> deflate-raw/base64url。
  if (type === 'z') {
    if (typeof DecompressionStream === 'undefined') throw new Error('当前浏览器不支持解压此分享地图');
    bytes = await transformBytes(bytes, new DecompressionStream('deflate-raw'));
  } else if (type !== 'j') {
    throw new Error(`未知的分享地图编码：${type}`);
  }
  return expandLegacyLevel(JSON.parse(new TextDecoder().decode(bytes)) as LegacyCompactLevel);
}

export function shareValueFromHash(hash = location.hash): string | null {
  const match = /(?:^#|[&#])map=([^&]+)/.exec(hash);
  return match ? decodeURIComponent(match[1]!) : null;
}

function encodeShareBinary(level: EditorLevel): Uint8Array {
  if (level.width > 255 || level.height > 255) throw new Error('DAT 分享格式只支持 255×255 以内的地图');
  if (level.objects.length > 0xffff) throw new Error('Object 数量超过 DAT 分享格式上限');

  const encoder = new TextEncoder();
  const name = encoder.encode(level.name);
  const author = encoder.encode(level.author ?? '');
  const description = encoder.encode(level.description ?? '');
  for (const [label, bytes] of [['名称', name], ['作者', author], ['描述', description]] as const) {
    if (bytes.length > 0xffff) throw new Error(`${label}过长`);
  }

  const datLength = 2 + level.width * level.height + 1 + 2 + level.objects.length * 3;
  const headerLength = MAGIC.length + 1 + 2 + 2 + 2 + name.length + author.length + description.length;
  const output = new Uint8Array(headerLength + datLength);
  const view = new DataView(output.buffer);
  let offset = 0;
  output.set(MAGIC, offset); offset += MAGIC.length;
  output[offset++] = SHARE_VERSION;
  view.setUint16(offset, name.length); offset += 2;
  view.setUint16(offset, author.length); offset += 2;
  view.setUint16(offset, description.length); offset += 2;
  output.set(name, offset); offset += name.length;
  output.set(author, offset); offset += author.length;
  output.set(description, offset); offset += description.length;

  output[offset++] = level.width;
  output[offset++] = level.height;
  for (const row of level.terrain) for (const type of row) output[offset++] = encodeDatTerrain(type);
  output[offset++] = Math.min(255, level.objects.filter((object) => DYNAMIC_OBJECT_IDS.has(object.type)).length);
  view.setUint16(offset, level.objects.length); offset += 2;
  for (const object of level.objects) {
    output[offset++] = encodeDatObject(object.type);
    output[offset++] = object.x;
    output[offset++] = object.y;
  }
  return output;
}

function decodeShareBinary(bytes: Uint8Array): EditorLevel {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  for (const expected of MAGIC) {
    if (bytes[offset++] !== expected) throw new Error('不是 bc5r 分享地图');
  }
  const version = bytes[offset++];
  if (version !== SHARE_VERSION) throw new Error(`不支持的分享地图版本：${String(version)}`);
  if (offset + 6 > bytes.length) throw new Error('分享地图 metadata 损坏');
  const nameLength = view.getUint16(offset); offset += 2;
  const authorLength = view.getUint16(offset); offset += 2;
  const descriptionLength = view.getUint16(offset); offset += 2;
  const metadataEnd = offset + nameLength + authorLength + descriptionLength;
  if (metadataEnd > bytes.length) throw new Error('分享地图 metadata 被截断');
  const decoder = new TextDecoder();
  const name = decoder.decode(bytes.subarray(offset, offset + nameLength)); offset += nameLength;
  const author = decoder.decode(bytes.subarray(offset, offset + authorLength)); offset += authorLength;
  const description = decoder.decode(bytes.subarray(offset, offset + descriptionLength)); offset += descriptionLength;

  if (offset + 5 > bytes.length) throw new Error('分享地图 DAT record 被截断');
  const width = bytes[offset++]!;
  const height = bytes[offset++]!;
  if (width < 1 || height < 1) throw new Error('分享地图尺寸无效');
  const terrainLength = width * height;
  if (offset + terrainLength + 3 > bytes.length) throw new Error('分享地图 terrain 被截断');
  const flatTerrain: TerrainType[] = [];
  for (let index = 0; index < terrainLength; index += 1) flatTerrain.push(decodeDatTerrain(bytes[offset++]!));
  offset += 1; // dynamicSlots；Editor 可由 objects 重新计算，不需要持久化这个派生值。
  const objectCount = view.getUint16(offset); offset += 2;
  if (offset + objectCount * 3 !== bytes.length) throw new Error('分享地图 object table 长度不一致');
  const objects: Array<{ type: ObjectType; x: number; y: number }> = [];
  for (let index = 0; index < objectCount; index += 1) {
    const type = decodeDatObject(bytes[offset++]!);
    const x = bytes[offset++]!;
    const y = bytes[offset++]!;
    objects.push({ type, x, y });
  }
  const terrain = Array.from({ length: height }, (_, y) => flatTerrain.slice(y * width, (y + 1) * width));
  return normalizeEditorLevel({
    schemaVersion: 2,
    name: name || 'Shared Bobby Level',
    ...(author ? { author } : {}),
    ...(description ? { description } : {}),
    width,
    height,
    terrain,
    objects
  });
}

function encodeDatTerrain(type: TerrainType): number {
  const known = DAT_BY_TERRAIN.get(type);
  if (known !== undefined) return known;
  const walkable = /^walkable-variant-(\d{2})$/.exec(type);
  if (walkable) return normalizeByte(0x60 + Number(walkable[1]) - 1);
  const background = /^background-variant-(\d{3})$/.exec(type);
  if (background) return normalizeByte(Number(background[1]) - 1);
  throw new Error(`无法编码为原版 DAT Terrain：${type}`);
}

function decodeDatTerrain(byte: number): TerrainType {
  const known = TERRAIN_BY_DAT.get(byte);
  if (known) return known;
  if (byte >= 0x60 && byte <= 0x93) return `walkable-variant-${String(byte - 0x60 + 1).padStart(2, '0')}` as TerrainType;
  return `background-variant-${String(byte + 1).padStart(3, '0')}` as TerrainType;
}

function encodeDatObject(type: ObjectType): number {
  const known = DAT_BY_OBJECT.get(type);
  if (known !== undefined) return known;
  const variant = /^object-variant-(\d{3})$/.exec(type);
  if (variant) return normalizeByte(Number(variant[1]) - 1);
  throw new Error(`无法编码为原版 DAT Object：${type}`);
}

function decodeDatObject(byte: number): ObjectType {
  return OBJECT_BY_DAT.get(byte) ?? `object-variant-${String(byte + 1).padStart(3, '0')}` as ObjectType;
}

function reverse<T extends string>(map: Map<number, T>): Map<T, number> {
  return new Map(Array.from(map, ([code, type]) => [type, code]));
}

function normalizeByte(value: number): number {
  if (!Number.isFinite(value)) throw new Error(`无效 DAT byte：${String(value)}`);
  return Math.min(255, Math.max(0, Math.trunc(value))) & 0xff;
}

function expandLegacyLevel(compact: LegacyCompactLevel): EditorLevel {
  if (compact.v !== 2) throw new Error(`不支持的旧分享地图版本：${String(compact.v)}`);
  const flat: TerrainType[] = [];
  for (let index = 0; index < compact.t.length; index += 2) {
    const type = compact.t[index];
    const count = compact.t[index + 1];
    if (typeof type !== 'string' || typeof count !== 'number' || count < 1) throw new Error('旧分享地图 terrain RLE 损坏');
    for (let i = 0; i < count; i += 1) flat.push(type as TerrainType);
  }
  if (flat.length !== compact.w * compact.h) throw new Error('旧分享地图 terrain 尺寸不一致');
  const terrain = Array.from({ length: compact.h }, (_, y) => flat.slice(y * compact.w, (y + 1) * compact.w));
  const objects: Array<{ type: ObjectType; x: number; y: number }> = [];
  for (let index = 0; index < compact.o.length; index += 3) {
    const type = compact.o[index];
    const x = compact.o[index + 1];
    const y = compact.o[index + 2];
    if (typeof type !== 'string' || typeof x !== 'number' || typeof y !== 'number') throw new Error('旧分享地图 object 数据损坏');
    objects.push({ type: type as ObjectType, x, y });
  }
  return normalizeEditorLevel({
    schemaVersion: 2,
    name: compact.n || 'Shared Bobby Level',
    ...(compact.a ? { author: compact.a } : {}),
    ...(compact.d ? { description: compact.d } : {}),
    width: compact.w,
    height: compact.h,
    terrain,
    objects
  });
}

async function transformBytes(input: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  await writer.write(new Uint8Array(input));
  await writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
