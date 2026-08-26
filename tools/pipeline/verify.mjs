import fs from "node:fs";
import path from "node:path";
import { root, run } from "../lib/fs.mjs";

run(process.execPath, ["tools/pipeline/source-quality.mjs"]);
run(process.execPath, ["tools/cli.mjs", "assets", "prepare"]);
run(process.execPath, ["tools/cli.mjs", "test"]);
run(process.execPath, ["tools/cli.mjs", "build"]);
run(process.execPath, ["tools/pipeline/browser-smoke.mjs"]);

const catalog = readJson("assets/maps/catalog.json");
if (catalog.levels.length !== 480 || catalog.specialScenes.length !== 5)
  throw new Error("Runtime catalog 必须包含 480 个 Campaign map 与 5 个 Special Scene");
for (const level of [...catalog.levels, ...catalog.specialScenes]) {
  const file = path.join(root, "assets", level.path);
  if (!fs.existsSync(file)) throw new Error(`缺少 Runtime map：${file}`);
  const map = readJson(file);
  if (map.schemaVersion !== 3 || !Array.isArray(map.terrain))
    throw new Error(`Runtime map 不是语义地图：${file}`);
}

for (const file of [
  "dist/assets/maps/catalog.json",
  "dist/assets/maps/original/1-1.json",
  "dist/assets/maps/original/1-bonus-1.json",
]) {
  if (!fs.existsSync(path.join(root, file)))
    throw new Error(`缺少构建产物：${file}`);
}
if (fs.existsSync(path.join(root, "dist/dat")))
  throw new Error("生产产物不应包含 DAT 模块");

console.log("verify: OK — source quality、原版/自定义地图、测试、构建与 DAT-free runtime 检查通过。");

function readJson(relative) {
  const file = path.isAbsolute(relative) ? relative : path.join(root, relative);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
