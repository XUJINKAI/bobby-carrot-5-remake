import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { root } from "../../lib/fs.mjs";
import { decodeDatObject, decodeDatTerrain } from "../dat/mapping.mjs";

const atlasLabel = /^ts-(?:[1-9]|1[0-6])-(?:[1-9]|1[0-6]):[a-z0-9-]+$/;

test("每个 DAT terrain 与 object byte 都解码为坐标前缀标签", () => {
  for (let byte = 0; byte <= 0xff; byte += 1) {
    assert.match(decodeDatTerrain(byte), atlasLabel, `terrain byte ${byte}`);
    assert.match(decodeDatObject(byte), atlasLabel, `object byte ${byte}`);
  }
});

test("所有 decoded 地图的 terrain 与 object 都带坐标前缀", () => {
  const decodedRoot = path.join(root, "original/decoded");
  const files = jsonFiles(decodedRoot);
  assert.ok(files.length > 0, "original/decoded 中应存在地图");
  for (const file of files) {
    const level = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const row of level.terrain ?? [])
      for (const terrain of row) assert.match(terrain, atlasLabel, file);
    for (const object of level.objects ?? [])
      assert.match(object.type, atlasLabel, file);
  }
});

function jsonFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return jsonFiles(target);
    return entry.isFile() && entry.name.endsWith(".json") ? [target] : [];
  });
}
