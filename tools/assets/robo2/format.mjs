const HEADER_BYTES = 3;
const MIN_DIMENSION = 1;
const MAX_DIMENSION = 255;

/** Robo 2 v1.0 关卡记录中的稳定半字节身份。 */
export const ROBO2_TILE_CODE = Object.freeze({
  FLOOR: 0x0,
  WALL: 0x1,
  EXIT: 0x2,
  STONE: 0x3,
  BOMB: 0x4,
  MIRROR_LEFT: 0x5,
  MIRROR_RIGHT: 0x6,
  LASER_DOWN: 0x7,
  LASER_RIGHT: 0x8,
  LASER_UP: 0x9,
  LASER_LEFT: 0xa,
  PLAYER: 0xb,
});

export const ROBO2_TILE_NAME_BY_CODE = Object.freeze([
  "floor",
  "wall",
  "exit",
  "stone",
  "bomb",
  "mirror-left",
  "mirror-right",
  "laser-down",
  "laser-right",
  "laser-up",
  "laser-left",
  "player",
]);

const KNOWN_THEME_COUNT = 4;
const MAX_TILE_CODE = ROBO2_TILE_CODE.PLAYER;

/**
 * 解码 JAR `data/<index>` 记录。Robo 2 使用列优先顺序，每字节先存高半字节。
 */
export function decodeRobo2LevelRecord(input, source = "Robo 2 level record") {
  const bytes = asBytes(input);
  if (bytes.length < HEADER_BYTES) {
    throw new Error(`${source}: 记录短于 ${HEADER_BYTES} 字节头部`);
  }

  const width = bytes[0];
  const height = bytes[1];
  const theme = bytes[2];
  validateHeader(width, height, theme, source);

  const cellCount = width * height;
  const expectedLength = HEADER_BYTES + Math.ceil(cellCount / 2);
  if (bytes.length !== expectedLength) {
    throw new Error(
      `${source}: 长度应为 ${expectedLength} 字节，实际 ${bytes.length} 字节`,
    );
  }

  const tiles = Array.from({ length: cellCount });
  for (let index = 0; index < cellCount; index += 1) {
    const packed = bytes[HEADER_BYTES + Math.floor(index / 2)];
    const code = index % 2 === 0 ? packed >> 4 : packed & 0x0f;
    const x = Math.floor(index / height);
    const y = index % height;
    if (code > MAX_TILE_CODE) {
      throw new Error(
        `${source}: (${x}, ${y}) 使用未知 tile code 0x${code.toString(16)}`,
      );
    }
    tiles[y * width + x] = code;
  }

  if (cellCount % 2 === 1 && (bytes.at(-1) & 0x0f) !== 0) {
    throw new Error(`${source}: 奇数格记录的末尾 padding 必须为 0`);
  }

  return {
    width,
    height,
    theme,
    tiles,
    rows: tileRows(width, tiles),
  };
}

/** 重新编码研究记录，用于证明 decoder 没有丢失地图字节。 */
export function encodeRobo2LevelRecord(level, source = "Robo 2 level") {
  const { width, height, theme } = level;
  validateHeader(width, height, theme, source);
  if (!Array.isArray(level.tiles) || level.tiles.length !== width * height) {
    throw new Error(
      `${source}: tiles 应包含 ${width * height} 格，实际 ${level.tiles?.length ?? 0} 格`,
    );
  }

  const output = Buffer.alloc(HEADER_BYTES + Math.ceil(level.tiles.length / 2));
  output[0] = width;
  output[1] = height;
  output[2] = theme;
  for (let index = 0; index < level.tiles.length; index += 1) {
    const x = Math.floor(index / height);
    const y = index % height;
    const code = level.tiles[y * width + x];
    if (!Number.isInteger(code) || code < 0 || code > MAX_TILE_CODE) {
      throw new Error(`${source}: tiles[${index}] 不是已知 tile code`);
    }
    const outputIndex = HEADER_BYTES + Math.floor(index / 2);
    if (index % 2 === 0) output[outputIndex] = code << 4;
    else output[outputIndex] |= code;
  }
  return output;
}

function validateHeader(width, height, theme, source) {
  if (!integerInRange(width, MIN_DIMENSION, MAX_DIMENSION)) {
    throw new Error(`${source}: width 必须是 1..255 的整数`);
  }
  if (!integerInRange(height, MIN_DIMENSION, MAX_DIMENSION)) {
    throw new Error(`${source}: height 必须是 1..255 的整数`);
  }
  if (!integerInRange(theme, 0, KNOWN_THEME_COUNT - 1)) {
    throw new Error(`${source}: theme 必须是 0..3 的整数`);
  }
}

function tileRows(width, tiles) {
  const rows = [];
  for (let offset = 0; offset < tiles.length; offset += width) {
    rows.push(
      tiles
        .slice(offset, offset + width)
        .map((code) => code.toString(16))
        .join(""),
    );
  }
  return rows;
}

function asBytes(input) {
  if (input instanceof Uint8Array) return input;
  throw new TypeError("Robo 2 level record 必须是 Uint8Array");
}

function integerInRange(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}
