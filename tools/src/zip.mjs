import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

function findEocd(buffer) {
  const min = Math.max(0, buffer.length - 0xffff - 22);
  for (let i = buffer.length - 22; i >= min; i -= 1) {
    if (buffer.readUInt32LE(i) === SIG_EOCD) return i;
  }
  throw new Error('ZIP EOCD record not found');
}

function safeOutputPath(root, name) {
  const normalized = name.replaceAll('\\', '/').replace(/^\/+/, '');
  const target = path.resolve(root, normalized);
  const resolvedRoot = path.resolve(root) + path.sep;
  if (target !== path.resolve(root) && !target.startsWith(resolvedRoot)) {
    throw new Error(`Unsafe ZIP path: ${name}`);
  }
  return target;
}

export function extractZip(zipPath, outputDir) {
  const buffer = fs.readFileSync(zipPath);
  const eocd = findEocd(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  let cursor = centralOffset;

  fs.mkdirSync(outputDir, { recursive: true });

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (buffer.readUInt32LE(cursor) !== SIG_CENTRAL) {
      throw new Error(`Invalid central directory entry at ${cursor}`);
    }

    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.subarray(cursor + 46, cursor + 46 + fileNameLength).toString('utf8');

    cursor += 46 + fileNameLength + extraLength + commentLength;
    const target = safeOutputPath(outputDir, name);

    if (name.endsWith('/')) {
      fs.mkdirSync(target, { recursive: true });
      continue;
    }

    if (buffer.readUInt32LE(localOffset) !== SIG_LOCAL) {
      throw new Error(`Invalid local file header for ${name}`);
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = zlib.inflateRawSync(compressed);
    else throw new Error(`Unsupported ZIP compression method ${method} for ${name}`);

    if (data.length !== uncompressedSize) {
      throw new Error(`Size mismatch for ${name}: got ${data.length}, expected ${uncompressedSize}`);
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  }
}
