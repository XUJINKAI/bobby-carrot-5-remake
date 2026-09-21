import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseMapDocument } from "@bobby/model";
import { root } from "../../../tools/lib/fs.mjs";

const mapsRoot = path.join(root, "assets/maps");
const reportedConflictLimit = 20;

test("所有生成地图的同格 stackOrder 只能对应一个 Entity", () => {
  const mapFiles = discoverMapFiles(mapsRoot);
  assert.ok(mapFiles.length > 0, "assets/maps 中必须存在生成地图");

  const conflicts = mapFiles.flatMap(findStackOrderConflicts);
  assert.equal(conflicts.length, 0, formatConflicts(conflicts));
});

function discoverMapFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return discoverMapFiles(target);
      if (!entry.isFile() || !entry.name.endsWith(".json")) return [];
      return entry.name === "index.json" ? [] : [target];
    })
    .sort();
}

function findStackOrderConflicts(file) {
  const document = parseMapDocument(
    JSON.parse(fs.readFileSync(file, "utf8")),
  );
  const occupied = new Map();
  const conflicts = [];

  document.entities.forEach((entity, index) => {
    const stackOrder = entity.stackOrder ?? 0;
    const key = `${entity.x},${entity.y},${stackOrder}`;
    const previous = occupied.get(key);
    if (previous) {
      conflicts.push({
        file,
        x: entity.x,
        y: entity.y,
        stackOrder,
        previous,
        current: { index, type: entity.type },
      });
      return;
    }
    occupied.set(key, { index, type: entity.type });
  });

  return conflicts;
}

function formatConflicts(conflicts) {
  if (conflicts.length === 0) return "";
  const lines = conflicts.slice(0, reportedConflictLimit).map((conflict) => {
    const relative = path.relative(root, conflict.file).split(path.sep).join("/");
    return (
      `${relative}: entities[${conflict.previous.index}] ` +
      `(${conflict.previous.type}) 与 entities[${conflict.current.index}] ` +
      `(${conflict.current.type}) 同时占用 ` +
      `(${conflict.x}, ${conflict.y}) 的 stackOrder ${conflict.stackOrder}`
    );
  });
  const remaining = conflicts.length - lines.length;
  if (remaining > 0) lines.push(`另有 ${remaining} 组冲突未显示`);
  return `生成地图存在 ${conflicts.length} 组同格同层 Entity：\n${lines.join("\n")}`;
}
