import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseLevelMap } from "@bobby/model";
import { root } from "../../lib/fs.mjs";
import { adaptDecodedMap } from "../entity-adapter.mjs";
import { reverseEntityMap } from "../entity-reverse-adapter.mjs";

test("全部官方 DAT source 经 Adapter 与反向 Adapter 后保持玩法语义", () => {
  const decodedRoot = path.join(root, "original/decoded");
  const files = levelJsonFiles(decodedRoot);
  assert.equal(files.length, 530, "官方 source record 数量应保持为 530");

  for (const file of files) {
    const source = JSON.parse(fs.readFileSync(file, "utf8"));
    const canonical = parseLevelMap({
      schemaVersion: 1,
      ...adaptDecodedMap(source),
    });
    const roundTrip = parseLevelMap({
      schemaVersion: 1,
      ...adaptDecodedMap(reverseEntityMap(canonical)),
    });

    assert.deepEqual(
      roundTrip,
      canonical,
      `${path.relative(decodedRoot, file)} 的 canonical LevelMap 语义发生变化`,
    );
  }
});

function levelJsonFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return levelJsonFiles(target);
    return entry.isFile() &&
        entry.name.endsWith(".json") &&
        path.basename(path.dirname(target)) === "levels"
      ? [target]
      : [];
  });
}
