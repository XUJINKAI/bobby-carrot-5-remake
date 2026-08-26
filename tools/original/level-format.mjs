import crypto from "node:crypto";
import {
  decodeDatLevelRecord,
  encodeDatLevelRecord,
  splitDatPackage,
} from "./dat/dist/index.js";

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
function readJavaUtf(buffer, offset) {
  if (offset + 2 > buffer.length) throw new Error("Truncated Java UTF length");
  const byteLength = buffer.readUInt16BE(offset);
  const start = offset + 2;
  const end = start + byteLength;
  if (end > buffer.length) throw new Error("Truncated Java UTF payload");
  return { value: buffer.subarray(start, end).toString("utf8"), offset: end };
}
export function parsePackMetadata(record) {
  if (record.length === 0) return null;
  let offset = 0;
  const packType = record.readUInt8(offset++);
  const languages = {};
  for (const language of ["DE", "EN", "FR", "IT", "SP", "PG"]) {
    const title = readJavaUtf(record, offset);
    offset = title.offset;
    const description = readJavaUtf(record, offset);
    offset = description.offset;
    languages[language] = {
      title: title.value,
      description: description.value,
    };
  }
  if (offset !== record.length)
    throw new Error(
      `Metadata record has ${record.length - offset} unread bytes`,
    );
  return { packType, languages };
}
export function parseLevelRecord(record, source) {
  const decoded = decodeDatLevelRecord(record);
  return {
    schemaVersion: 2,
    terrainEncoding: "semantic-row-major",
    source,
    recordLength: record.length,
    recordSha256: sha256(record),
    dynamicSlots: decoded.dynamicSlots,
    ...decoded.map,
  };
}
export function encodeLevelRecord(level) {
  return Buffer.from(encodeDatLevelRecord(level));
}
export function parseDatPackage(buffer, sourceBase) {
  const parts = splitDatPackage(buffer);
  const metadataRecord = Buffer.from(parts.metadataRecord);
  const metadata = parsePackMetadata(metadataRecord);
  return {
    metadataLength: metadataRecord.length,
    metadata,
    levels: parts.levelRecords.map((record, index) =>
      parseLevelRecord(Buffer.from(record), {
        ...sourceBase,
        levelIndex: index + 1,
      }),
    ),
    packageSha256: sha256(buffer),
  };
}
