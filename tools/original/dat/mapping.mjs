import {
  ORIGINAL_TILE_ATLASES,
  originalTileAtlasCell,
  originalTileCoordinateLabel,
  originalTileVisual,
  parseOriginalTileCoordinateLabel,
} from "@bobby/model";

const TAGGED_TILE = /^(ts-(?:[1-9]|1[0-6])-(?:[1-9]|1[0-6])):([a-z0-9-]+)$/;
const FIRST_OBJECT_TILE_BYTE = byteForVisual(
  originalTileVisual({ type: "carrot", phase: "consumed" }),
);
const hex = (value) => `0x${value.toString(16).padStart(2, "0").toUpperCase()}`;

export function decodeDatTerrain(byte) {
  return decodeDatTile(byte);
}

export function encodeDatTerrain(type) {
  return encodeDatTile(type, "terrain");
}

export function decodeDatObject(byte) {
  return decodeDatTile(byte);
}

export function encodeDatObject(type) {
  return encodeDatTile(type, "object");
}

/** decoded 标签中的坐标是 DAT byte 的无损身份，后缀只用于人工审阅。 */
export function decodedAtlasCoordinate(type) {
  return decodedTile(type)?.coordinate;
}

/** 返回 decoded 标签指向的目录条目，供唯一 Adapter 边界消费。 */
export function decodedTileVisual(type) {
  return decodedTile(type)?.visual;
}

/** 从 decoded 坐标恢复原版 DAT byte，不解释 terrain/object 层语义。 */
export function decodedTileByte(type) {
  const decoded = decodedTile(type);
  if (!decoded) return undefined;
  return byteForVisual(decoded.visual);
}

/** 判断 TS 单元是否属于原版 objects 表使用的图块区。 */
export function isDatObjectTile(type) {
  const byte = decodedTileByte(type);
  return byte !== undefined && byte >= FIRST_OBJECT_TILE_BYTE;
}

/** 为 decoded archive 生成包含坐标与可读名称的稳定标签。 */
export function decodedTileLabel(source) {
  return `${originalTileCoordinateLabel(source)}:${source.name}`;
}

export function datSourceForTerrain(type) {
  return datSourceForTile(type, "terrain");
}

export function datSourceForObject(type) {
  return datSourceForTile(type, "object");
}

function decodeDatTile(byte) {
  const code = normalizeByte(byte);
  const columns = ORIGINAL_TILE_ATLASES.ts.columns;
  const row = Math.floor(code / columns) + 1;
  const column = (code % columns) + 1;
  return decodedTileLabel(requireOriginalTile(row, column));
}

function encodeDatTile(type, layer) {
  const decoded = decodedTile(type);
  if (!decoded) {
    throw new Error(`No original DAT ${layer} mapping for tile: ${type}`);
  }
  return byteForVisual(decoded.visual);
}

function decodedTile(type) {
  if (typeof type !== "string") return undefined;
  const tagged = TAGGED_TILE.exec(type);
  const coordinate = tagged?.[1] ?? type;
  const source = parseOriginalTileCoordinateLabel(coordinate);
  if (!source) return undefined;
  const visual = originalTileAtlasCell("ts", source.row, source.column);
  if (!visual) return undefined;
  if (tagged && tagged[2] !== visual.name) {
    throw new Error(
      `Decoded Tile 标签与目录不一致：${type}，目录名称为 ${visual.name}`,
    );
  }
  return { coordinate, visual };
}

function datSourceForTile(type, layer) {
  try {
    return {
      datHexIds: [
        hex(layer === "terrain" ? encodeDatTerrain(type) : encodeDatObject(type)),
      ],
      confidence: TAGGED_TILE.test(type) ? "confirmed" : "inferred",
    };
  } catch {
    return undefined;
  }
}

function normalizeByte(value) {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid DAT byte: ${String(value)}`);
  }
  return Math.min(255, Math.max(0, Math.trunc(value))) & 0xff;
}

function byteForVisual(visual) {
  const columns = ORIGINAL_TILE_ATLASES.ts.columns;
  return (visual.row - 1) * columns + visual.column - 1;
}

function requireOriginalTile(row, column) {
  const visual = originalTileAtlasCell("ts", row, column);
  if (!visual) {
    throw new Error(`Original Tile Visual 目录缺少 ts:${row}-${column}`);
  }
  return visual;
}
