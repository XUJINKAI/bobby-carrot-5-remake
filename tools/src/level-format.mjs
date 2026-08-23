import crypto from 'node:crypto';
import { decodeDatLevel, encodeDatObject, encodeDatTerrain } from './dat-codec.mjs';

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function readJavaUtf(buffer, offset) {
  if (offset + 2 > buffer.length) throw new Error('Truncated Java UTF length');
  const byteLength = buffer.readUInt16BE(offset);
  const start = offset + 2;
  const end = start + byteLength;
  if (end > buffer.length) throw new Error('Truncated Java UTF payload');
  // Bobby 的字符串实际使用普通 UTF-8 兼容序列；样本中未出现 Java Modified UTF-8 的 NUL 特例。
  const value = buffer.subarray(start, end).toString('utf8');
  return { value, offset: end };
}

export function parsePackMetadata(record) {
  if (record.length === 0) return null;
  let offset = 0;
  const packType = record.readUInt8(offset);
  offset += 1;
  const languages = {};
  for (const language of ['DE', 'EN', 'FR', 'IT', 'SP', 'PG']) {
    const title = readJavaUtf(record, offset);
    offset = title.offset;
    const description = readJavaUtf(record, offset);
    offset = description.offset;
    languages[language] = { title: title.value, description: description.value };
  }
  if (offset !== record.length) {
    throw new Error(`Metadata record has ${record.length - offset} unread bytes`);
  }
  return { packType, languages };
}

/**
 * Parse one original DAT level record and immediately cross the codec boundary.
 * The returned value is the semantic bc5r LevelData shape; raw DAT tile/object bytes
 * never escape this module + dat-codec.mjs.
 */
export function parseLevelRecord(record, source) {
  if (record.length < 5) throw new Error(`Level record too short: ${record.length}`);
  let offset = 0;
  const width = record.readUInt8(offset++);
  const height = record.readUInt8(offset++);
  const terrainBytes = width * height;
  if (offset + terrainBytes + 3 > record.length) {
    throw new Error(`Invalid dimensions ${width}x${height} for record length ${record.length}`);
  }

  const rawTerrain = [];
  for (let y = 0; y < height; y += 1) {
    rawTerrain.push(Array.from(record.subarray(offset + y * width, offset + (y + 1) * width)));
  }
  offset += terrainBytes;

  const dynamicSlots = record.readUInt8(offset++);
  const objectCount = record.readUInt16BE(offset);
  offset += 2;
  const rawObjects = [];
  for (let index = 0; index < objectCount; index += 1) {
    if (offset + 3 > record.length) throw new Error('Truncated object table');
    rawObjects.push({
      id: record.readUInt8(offset++),
      x: record.readUInt8(offset++),
      y: record.readUInt8(offset++)
    });
  }
  if (offset !== record.length) {
    throw new Error(`Level record has ${record.length - offset} unread bytes`);
  }

  return decodeDatLevel({
    source,
    recordLength: record.length,
    recordSha256: sha256(record),
    width,
    height,
    dynamicSlots,
    terrain: rawTerrain,
    objects: rawObjects
  });
}

/** Encode the semantic level model back to an original DAT level record. */
export function encodeLevelRecord(level) {
  const width = Number(level.width);
  const height = Number(level.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || width > 255 || height < 1 || height > 255) {
    throw new Error(`DAT dimensions must fit unsigned bytes: ${width}x${height}`);
  }
  if (!Array.isArray(level.terrain) || level.terrain.length !== height || level.terrain.some((row) => !Array.isArray(row) || row.length !== width)) {
    throw new Error('Semantic terrain dimensions do not match level width/height');
  }
  if (!Array.isArray(level.objects) || level.objects.length > 0xffff) throw new Error('Too many DAT objects');

  const recordLength = 2 + width * height + 1 + 2 + level.objects.length * 3;
  const record = Buffer.alloc(recordLength);
  let offset = 0;
  record.writeUInt8(width, offset++);
  record.writeUInt8(height, offset++);
  for (const row of level.terrain) {
    for (const type of row) record.writeUInt8(encodeDatTerrain(type), offset++);
  }
  record.writeUInt8(Math.max(0, Math.min(255, Math.trunc(Number(level.dynamicSlots ?? 0)))), offset++);
  record.writeUInt16BE(level.objects.length, offset);
  offset += 2;
  for (const object of level.objects) {
    record.writeUInt8(encodeDatObject(object.type), offset++);
    record.writeUInt8(object.x, offset++);
    record.writeUInt8(object.y, offset++);
  }
  return record;
}

export function parseDatPackage(buffer, sourceBase) {
  if (buffer.length < 2) throw new Error('DAT package is too short');
  const metadataLength = buffer.readUInt16BE(0);
  const metadataStart = 2;
  const metadataEnd = metadataStart + metadataLength;
  if (metadataEnd > buffer.length) throw new Error('Metadata length exceeds DAT size');
  const metadataRecord = buffer.subarray(metadataStart, metadataEnd);
  const metadata = parsePackMetadata(metadataRecord);

  const levels = [];
  let offset = metadataEnd;
  let levelIndex = 1;
  while (offset < buffer.length) {
    if (offset + 2 > buffer.length) throw new Error('Truncated level length prefix');
    const recordLength = buffer.readUInt16BE(offset);
    const recordStart = offset + 2;
    const recordEnd = recordStart + recordLength;
    if (recordEnd > buffer.length) throw new Error(`Level ${levelIndex} exceeds DAT package size`);
    const record = buffer.subarray(recordStart, recordEnd);
    levels.push(parseLevelRecord(record, { ...sourceBase, levelIndex }));
    offset = recordEnd;
    levelIndex += 1;
  }

  return {
    metadataLength,
    metadata,
    levels,
    packageSha256: sha256(buffer)
  };
}
