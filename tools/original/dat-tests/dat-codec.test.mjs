import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  datSourceForObject,
  datSourceForTerrain,
  decodeDatLevelRecord,
  deriveDatDynamicSlots,
  encodeDatLevelRecord,
  replaceDatLevelRecord,
  splitDatPackage,
} from "../dat/index.mjs";
import { LegacyObject, LegacyTerrain } from "../dat/semantic-ids.mjs";

test("DAT record round-trips byte-for-byte through semantic LevelMap", () => {
  const dat = fs.readFileSync("original/extracted/base/00.dat");
  const parts = splitDatPackage(dat);
  const record = parts.levelRecords[0];
  assert.ok(record);
  const decoded = decodeDatLevelRecord(record);
  assert.equal(decoded.map.terrain[16]?.[7], LegacyTerrain.START);
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
    datSourceForTerrain(LegacyTerrain.CAROUSEL_1)?.datHexIds[0],
    "0xB9",
  );
  assert.equal(
    datSourceForTerrain(LegacyTerrain.MIRROR_1)?.datHexIds[0],
    "0xB1",
  );
  assert.equal(
    datSourceForObject(LegacyObject.LOCK)?.datHexIds[0],
    "0xCD",
  );

  for (const id of Object.values(LegacyTerrain)) {
    const source = datSourceForTerrain(id);
    assert.match(source?.datHexIds[0] ?? "", /^0x[0-9A-F]{2}$/);
    assert.equal(source?.confidence, "confirmed");
  }
  for (const id of Object.values(LegacyObject)) {
    const source = datSourceForObject(id);
    assert.match(source?.datHexIds[0] ?? "", /^0x[0-9A-F]{2}$/);
    assert.equal(source?.confidence, "confirmed");
  }
});

test("unnamed semantic variants keep inferred DAT provenance in Original tooling", () => {
  const walkable = datSourceForTerrain("walkable-variant-01");
  assert.equal(walkable?.datHexIds[0], "0x60");
  assert.equal(walkable?.confidence, "inferred");

  const background = datSourceForTerrain("background-variant-001");
  assert.equal(background?.datHexIds[0], "0x00");
  assert.equal(background?.confidence, "inferred");

  const objectVariant = datSourceForObject("object-variant-001");
  assert.equal(objectVariant?.datHexIds[0], "0x00");
  assert.equal(objectVariant?.confidence, "inferred");
});
