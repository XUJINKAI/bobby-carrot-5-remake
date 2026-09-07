import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  datSourceForObject,
  datSourceForTerrain,
  decodeDatObject,
  decodeDatTerrain,
  decodeDatLevelRecord,
  deriveDatDynamicSlots,
  encodeDatObject,
  encodeDatTerrain,
  encodeDatLevelRecord,
  replaceDatLevelRecord,
  splitDatPackage,
} from "../dat/index.mjs";
import { DecodedObject, DecodedTerrain } from "../dat/semantic-ids.mjs";

test("DAT record round-trips byte-for-byte through semantic LevelMap", () => {
  const dat = fs.readFileSync("original/extracted/base/00.dat");
  const parts = splitDatPackage(dat);
  const record = parts.levelRecords[0];
  assert.ok(record);
  const decoded = decodeDatLevelRecord(record);
  assert.equal(
    decoded.map.terrain[16]?.[7],
    "ts-10-6:start",
  );
  assert.equal(deriveDatDynamicSlots(decoded.map), decoded.dynamicSlots);
  assert.deepEqual(
    Buffer.from(encodeDatLevelRecord(decoded.map)),
    Buffer.from(record),
  );
});

test("DAT package replacement preserves metadata and untouched records", () => {
  const dat = fs.readFileSync("original/extracted/base/00.dat");
  const before = splitDatPackage(dat);
  const replacement = before.levelRecords[0];
  assert.ok(replacement);
  const patched = splitDatPackage(replaceDatLevelRecord(dat, 2, replacement));
  assert.deepEqual(
    Buffer.from(patched.metadataRecord),
    Buffer.from(before.metadataRecord),
  );
  assert.deepEqual(
    Buffer.from(patched.levelRecords[0]),
    Buffer.from(before.levelRecords[0]),
  );
  assert.deepEqual(
    Buffer.from(patched.levelRecords[1]),
    Buffer.from(replacement),
  );
  for (let index = 2; index < before.levelRecords.length; index += 1) {
    assert.deepEqual(
      Buffer.from(patched.levelRecords[index]),
      Buffer.from(before.levelRecords[index]),
    );
  }
});

test("original DAT provenance belongs to the Original tooling boundary", () => {
  assert.equal(
    datSourceForTerrain(DecodedTerrain.CAROUSEL_1)?.datHexIds[0],
    "0xB9",
  );
  assert.equal(
    datSourceForTerrain(DecodedTerrain.MIRROR_1)?.datHexIds[0],
    "0xB1",
  );
  assert.equal(
    datSourceForObject(DecodedObject.LOCK)?.datHexIds[0],
    "0xCD",
  );

  for (const id of Object.values(DecodedTerrain)) {
    const source = datSourceForTerrain(id);
    assert.match(source?.datHexIds[0] ?? "", /^0x[0-9A-F]{2}$/);
    assert.equal(source?.confidence, "confirmed");
  }
  for (const id of Object.values(DecodedObject)) {
    const source = datSourceForObject(id);
    assert.match(source?.datHexIds[0] ?? "", /^0x[0-9A-F]{2}$/);
    assert.equal(source?.confidence, "confirmed");
  }
});

test("atlas-tagged semantic variants keep inferred DAT provenance in Original tooling", () => {
  assert.equal(decodeDatTerrain(0x2b), "ts-3-12:tree");

  const walkable = datSourceForTerrain("ts-7-1");
  assert.equal(walkable?.datHexIds[0], "0x60");
  assert.equal(walkable?.confidence, "inferred");

  const background = datSourceForTerrain("ts-1-1");
  assert.equal(background?.datHexIds[0], "0x00");
  assert.equal(background?.confidence, "inferred");

  const object = datSourceForObject("ts-1-1:stump");
  assert.equal(object?.datHexIds[0], "0x00");
  assert.equal(object?.confidence, "inferred");
});

test("decoded terrain 与 object 使用统一的 atlas-first 标签", () => {
  for (let byte = 0; byte <= 0xff; byte += 1) {
    const terrain = decodeDatTerrain(byte);
    const object = decodeDatObject(byte);
    assert.match(
      terrain,
      /^ts-(?:[1-9]|1[0-6])-(?:[1-9]|1[0-6]):[a-z0-9-]+$/,
    );
    assert.match(
      object,
      /^ts-(?:[1-9]|1[0-6])-(?:[1-9]|1[0-6]):[a-z0-9-]+$/,
    );
    assert.equal(encodeDatTerrain(terrain), byte);
    assert.equal(encodeDatObject(object), byte);
  }
  assert.equal(decodeDatTerrain(0x3c), "ts-4-13:tree");
  assert.equal(decodeDatTerrain(0x92), "ts-10-3:stone-wall");
  assert.equal(decodeDatTerrain(0x93), "ts-10-4:stone-wall");
  assert.equal(decodeDatTerrain(0x9e), "ts-10-15:shop-empty");
  assert.equal(decodeDatObject(0xfd), "ts-16-14:fence");
});
