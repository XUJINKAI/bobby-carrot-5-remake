import type { ObjectType, TerrainType } from './types.js';

/**
 * 唯一允许理解原版 DAT byte / ts.png atlas index 的运行时代码。
 *
 * Engine / Editor / Web 的业务逻辑只使用语义 ID。这里同时承担：
 * - DAT decode / encode；
 * - 原版 ts.png 的 atlas index 映射；
 * - 仍由字节码范围定义、尚未逐格命名的原作分类查询。
 *
 * 未逆出明确含义的 byte 会变成稳定的 `terrain-NNN` / `object-NNN`，不会把十六进制魔数泄漏到 JSON。
 */
const KNOWN_TERRAIN_BY_CODE: Readonly<Record<number, TerrainType>> = {
  77: 'snow',
  85: 'water',
  86: 'water-animated',
  87: 'tide-up', 88: 'tide-down', 89: 'tide-left', 90: 'tide-right',
  91: 'water-variant-1', 92: 'water-variant-2', 93: 'water-variant-3',
  94: 'ground-a', 95: 'ground-b',
  124: 'shovel-cleared-ground',
  144: 'ground-c', 145: 'ground-d', 148: 'ice', 149: 'start', 150: 'exit',
  151: 'shop-dream', 152: 'shop-cloud9', 153: 'shop-super-key', 154: 'shop-stereo',
  155: 'shop-music', 156: 'shop-speed-shoes', 157: 'shop-coin-radar', 158: 'shop-unavailable',
  159: 'shovel-pickup', 160: 'mower-parking',
  161: 'speed-switch-pressed', 162: 'speed-switch-raised',
  163: 'carousel-switch-raised', 164: 'carousel-switch-pressed',
  165: 'tide-switch-raised', 166: 'tide-switch-pressed',
  167: 'wind-switch-0-on', 168: 'wind-switch-0-off', 169: 'wind-switch-1-on', 170: 'wind-switch-1-off',
  171: 'wind-switch-2-on', 172: 'wind-switch-2-off', 173: 'wind-switch-3-on', 174: 'wind-switch-3-off',
  175: 'trap-active', 176: 'trap-inactive',
  177: 'mirror-1', 178: 'mirror-2', 179: 'mirror-3', 180: 'mirror-4',
  181: 'speed-up', 182: 'speed-down', 183: 'speed-left', 184: 'speed-right',
  185: 'carousel-1', 186: 'carousel-2', 187: 'carousel-3', 188: 'carousel-4',
  189: 'carousel-vertical', 190: 'carousel-horizontal',
  191: 'color-yellow-switch-raised', 192: 'color-yellow-switch-pressed',
  193: 'color-pink-switch-raised', 194: 'color-pink-switch-pressed',
  195: 'color-yellow-block-raised', 196: 'color-yellow-block-lowered',
  197: 'color-pink-block-raised', 198: 'color-pink-block-lowered',
  199: 'high-grass', 200: 'high-grass-objective'
};

const KNOWN_OBJECT_BY_CODE: Readonly<Record<number, ObjectType>> = {
  201: 'consumed-carrot', 202: 'carrot', 203: 'egg-nest-empty', 204: 'egg-nest-filled', 205: 'lock',
  206: 'beanstalk-tip', 207: 'bean', 208: 'windmill-up', 209: 'windmill-down', 210: 'windmill-left', 211: 'windmill-right',
  212: 'plank', 213: 'plank-crumbling', 214: 'plank-fragment',
  215: 'dragon-head', 216: 'dragon-body', 217: 'dragon-tail', 218: 'sandman', 219: 'dream-machine',
  220: 'mower', 221: 'gas', 222: 'beanstalk-mid', 223: 'bean-field',
  224: 'cloud-red', 225: 'cloud-purple', 226: 'cloud-green', 227: 'ice-block',
  228: 'ice-melt-1', 229: 'ice-melt-2', 230: 'ice-melt-3', 231: 'beaver-base',
  232: 'dragon-anim-1', 233: 'dragon-anim-2', 234: 'sandman-body', 235: 'dream-machine-body',
  236: 'leaf', 237: 'crumbly-rock', 238: 'beanstalk-base', 239: 'bean-sprout',
  240: 'cloud-grid-red', 241: 'cloud-grid-purple', 242: 'cloud-grid-green', 243: 'kite', 244: 'whirlwind',
  245: 'landing', 246: 'golden-carrot', 247: 'beaver-body', 248: 'bonus-coin',
  249: 'fence-1', 250: 'fence-2', 251: 'fence-3', 252: 'fence-4', 253: 'fence-5', 254: 'fence-6', 255: 'empty'
};

const TERRAIN_CODE_BY_KNOWN = reverseMap(KNOWN_TERRAIN_BY_CODE);
const OBJECT_CODE_BY_KNOWN = reverseMap(KNOWN_OBJECT_BY_CODE);

export function terrainFromOriginalCode(code: number): TerrainType {
  const normalized = normalizeByte(code);
  return KNOWN_TERRAIN_BY_CODE[normalized] ?? `terrain-${String(normalized).padStart(3, '0')}`;
}

export function objectFromOriginalCode(code: number): ObjectType {
  const normalized = normalizeByte(code);
  return KNOWN_OBJECT_BY_CODE[normalized] ?? `object-${String(normalized).padStart(3, '0')}`;
}

export function originalCodeForTerrain(type: TerrainType): number {
  return TERRAIN_CODE_BY_KNOWN.get(type) ?? parseOpaque(type, 'terrain');
}

export function originalCodeForObject(type: ObjectType): number {
  return OBJECT_CODE_BY_KNOWN.get(type) ?? parseOpaque(type, 'object');
}

export function originalCodeHex(code: number): string {
  return `0x${normalizeByte(code).toString(16).padStart(2, '0').toUpperCase()}`;
}

export function originalSignedCode(code: number): number {
  const normalized = normalizeByte(code);
  return normalized > 127 ? normalized - 256 : normalized;
}

/** 原版默认水域范围；具体含义尚未全部逐格确认。 */
export function isOriginalWaterTerrain(type: TerrainType): boolean {
  const code = originalCodeForTerrain(type);
  return code >= 85 && code <= 90;
}

/** 原版默认可步行范围（具体机关状态由 gameplay rules 继续排除）。 */
export function isOriginalOrdinaryWalkableTerrain(type: TerrainType): boolean {
  const code = originalCodeForTerrain(type);
  return code >= 94 && code <= 200 && !isOriginalWaterTerrain(type);
}

/** 原版 S() 字节码允许藤蔓生长到 unsigned terrain <= 93 的格。 */
export function allowsOriginalBeanstalkGrowth(type: TerrainType): boolean {
  return originalCodeForTerrain(type) <= 93;
}

/** 云的保守可见游戏区域边界，来自既有逆向范围。 */
export function isOriginalCloudPassableBackground(type: TerrainType): boolean {
  const code = originalCodeForTerrain(type);
  return isOriginalOrdinaryWalkableTerrain(type) || isOriginalWaterTerrain(type) || (code >= 71 && code <= 93);
}

/** 龙火 Q() 的原始可通过地形范围。 */
export function isOriginalDragonFireBackground(type: TerrainType): boolean {
  const code = originalCodeForTerrain(type);
  return (code >= 94 && code <= 200) || (code >= 85 && code <= 93) || (code >= 71 && code <= 76);
}

function normalizeByte(value: number): number {
  if (!Number.isFinite(value)) throw new Error(`Invalid original byte: ${String(value)}`);
  return Math.min(255, Math.max(0, Math.trunc(value))) & 0xff;
}

function reverseMap<T extends string>(source: Readonly<Record<number, T>>): Map<T, number> {
  const result = new Map<T, number>();
  for (const [code, value] of Object.entries(source)) result.set(value, Number(code));
  return result;
}

function parseOpaque(value: string, prefix: 'terrain' | 'object'): number {
  const match = new RegExp(`^${prefix}-(\\d{3})$`).exec(value);
  if (!match) throw new Error(`No original code mapping for semantic ${prefix}: ${value}`);
  return normalizeByte(Number(match[1]));
}
