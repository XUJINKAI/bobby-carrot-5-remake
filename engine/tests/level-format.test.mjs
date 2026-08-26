import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  encodeLevelRecord,
  parseDatPackage,
} from "../../tools/original/level-format.mjs";

function decodeEdition(edition) {
  const levels = [];
  for (let pack = 0; pack <= 4; pack += 1) {
    const file = pack.toString().padStart(2, "0");
    const buffer = fs.readFileSync(
      path.resolve(`original/extracted/${edition}/${file}.dat`),
    );
    levels.push(...parseDatPackage(buffer, { edition, packFile: file }).levels);
  }
  return levels;
}

test("Base 与 UP9 都能解码为 53 个 source level", () => {
  assert.equal(decodeEdition("base").length, 53);
  assert.equal(decodeEdition("up09").length, 53);
});

test("base and UP9 share the five 00.dat levels byte-for-byte", () => {
  const base = parseDatPackage(
    fs.readFileSync("original/extracted/base/00.dat"),
    { edition: "base", packFile: "00" },
  );
  const hd = parseDatPackage(fs.readFileSync("original/extracted/up09/00.dat"), {
    edition: "up09",
    packFile: "00",
  });
  assert.equal(base.levels.length, 5);
  assert.deepEqual(
    base.levels.map((level) => level.recordSha256),
    hd.levels.map((level) => level.recordSha256),
  );
});

test("level 001 crosses the DAT boundary as semantic schema v2", () => {
  const parsed = parseDatPackage(
    fs.readFileSync("original/extracted/base/00.dat"),
    { edition: "base", packFile: "00" },
  );
  const level = parsed.levels[0];
  assert.ok(level);
  assert.equal(level.schemaVersion, 2);
  assert.equal(level.terrainEncoding, "semantic-row-major");
  assert.equal(level.width, 25);
  assert.equal(level.height, 20);
  assert.equal(level.objects.length, 10);
  assert.equal(level.terrain[16]?.[7], "start");
  assert.ok(
    level.objects.every(
      (object) => typeof object.type === "string" && !("id" in object),
    ),
  );
});

test("semantic level can encode back to the exact original DAT record", () => {
  const dat = fs.readFileSync("original/extracted/base/00.dat");
  const parsed = parseDatPackage(dat, { edition: "base", packFile: "00" });
  const level = parsed.levels[0];
  assert.ok(level);
  const metadataLength = dat.readUInt16BE(0);
  const recordLengthOffset = 2 + metadataLength;
  const originalLength = dat.readUInt16BE(recordLengthOffset);
  const original = dat.subarray(
    recordLengthOffset + 2,
    recordLengthOffset + 2 + originalLength,
  );
  assert.deepEqual(encodeLevelRecord(level), original);
});
