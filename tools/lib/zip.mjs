import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

function findEocd(buffer) {
  const min = Math.max(0, buffer.length - 0xffff - 22);
  for (let i = buffer.length - 22; i >= min; i -= 1) {
    if (buffer.readUInt32LE(i) === SIG_EOCD) return i;
  }
  throw new Error("ZIP EOCD record not found");
}

function safeOutputPath(root, name) {
  const normalized = name.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (
    normalized.startsWith("/") ||
    /^[a-z]:\//i.test(normalized) ||
    normalized.includes("\0") ||
    segments.includes("..")
  ) {
    throw new Error(`Unsafe ZIP path: ${name}`);
  }
  const target = path.resolve(root, normalized);
  const resolvedRoot = path.resolve(root) + path.sep;
  if (target !== path.resolve(root) && !target.startsWith(resolvedRoot)) {
    throw new Error(`Unsafe ZIP path: ${name}`);
  }
  return target;
}

export function extractZip(zipPath, outputDir) {
  const buffer = fs.readFileSync(zipPath);
  fs.mkdirSync(outputDir, { recursive: true });
  const extractedFiles = [];

  for (const entry of readCentralDirectory(buffer)) {
    const {
      compressedSize,
      localOffset,
      method,
      name,
      uncompressedSize,
    } = entry;
    const target = safeOutputPath(outputDir, name);

    if (name.endsWith("/")) {
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
    else
      throw new Error(
        `Unsupported ZIP compression method ${method} for ${name}`,
      );

    if (data.length !== uncompressedSize) {
      throw new Error(
        `Size mismatch for ${name}: got ${data.length}, expected ${uncompressedSize}`,
      );
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
    extractedFiles.push(name.replaceAll("\\", "/"));
  }

  return extractedFiles;
}

export function listZipEntries(zipPath) {
  return readCentralDirectory(fs.readFileSync(zipPath)).map((entry) => ({
    name: entry.name,
    size: entry.uncompressedSize,
    directory: entry.name.endsWith("/"),
  }));
}

function readCentralDirectory(buffer) {
  const eocd = findEocd(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== SIG_CENTRAL) {
      throw new Error(`Invalid central directory entry at ${cursor}`);
    }
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    entries.push({
      method: buffer.readUInt16LE(cursor + 10),
      compressedSize: buffer.readUInt32LE(cursor + 20),
      uncompressedSize: buffer.readUInt32LE(cursor + 24),
      localOffset: buffer.readUInt32LE(cursor + 42),
      name: buffer
        .subarray(cursor + 46, cursor + 46 + fileNameLength)
        .toString("utf8"),
    });
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}
