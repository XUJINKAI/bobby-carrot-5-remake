import fs from "node:fs";
import path from "node:path";
import { root, run } from "../lib/fs.mjs";

run(process.execPath, ["tools/pipeline/source-quality.mjs"]);
const packageJson = readJson("package.json");
for (const [name, command] of Object.entries(packageJson.scripts ?? {}))
  if (!String(command).startsWith("node tools/cli.mjs "))
    throw new Error(`npm script 必须是 tools/cli.mjs alias：${name}`);
run(process.execPath, ["tools/cli.mjs", "assets", "prepare"]);
run(process.execPath, ["tools/cli.mjs", "test"]);
run(process.execPath, ["tools/cli.mjs", "build"]);
run(process.execPath, ["tools/pipeline/browser-smoke.mjs"]);

const collections = readJson("assets/maps/index.json");
if (!collections.collections.some((collection) => collection.id === "original"))
  throw new Error("Runtime collection index 必须包含 original");
const catalog = readJson("assets/maps/original/index.json");
if (catalog.levels.length !== 480 || catalog.specialScenes.length !== 5)
  throw new Error("Runtime catalog 必须包含 480 个 Campaign map 与 5 个 Special Scene");
for (const level of [...catalog.levels, ...catalog.specialScenes]) {
  const file = path.join(root, "assets", level.path);
  if (!fs.existsSync(file)) throw new Error(`缺少 Runtime map：${file}`);
  const map = readJson(file);
  if (map.schemaVersion !== 3 || !Array.isArray(map.terrain))
    throw new Error(`Runtime map 不是语义地图：${file}`);
}
for (const level of catalog.levels)
  if (
    !Number.isInteger(level.carrotCount) ||
    !Array.isArray(level.specialItems) ||
    !Array.isArray(level.scenes) ||
    !Array.isArray(level.mechanics)
  )
    throw new Error(`Original collection metadata 不完整：${level.publicId}`);

for (const obsolete of ["catalog.json", "custom-catalog.json", "filters.json"])
  if (fs.existsSync(path.join(root, "assets/maps", obsolete)))
    throw new Error(`Runtime maps 根目录包含旧 metadata：${obsolete}`);

for (const file of [
  "dist/assets/maps/index.json",
  "dist/assets/maps/original/index.json",
  "dist/assets/maps/original/1-1.json",
  "dist/assets/maps/original/1-bonus-1.json",
]) {
  if (!fs.existsSync(path.join(root, file)))
    throw new Error(`缺少构建产物：${file}`);
}
if (fs.existsSync(path.join(root, "dist/dat")))
  throw new Error("生产产物不应包含 DAT 模块");
for (const obsolete of ["web/dist-src", "web/dist-vite"])
  if (fs.existsSync(path.join(root, obsolete)))
    throw new Error(`Web 不应生成中间编译目录：${obsolete}`);
assertSameTree(path.join(root, "assets"), path.join(root, "dist/assets"));

console.log("verify: OK — source quality、原版/自定义地图、测试、构建与 DAT-free runtime 检查通过。");

function readJson(relative) {
  const file = path.isAbsolute(relative) ? relative : path.join(root, relative);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertSameTree(source, target) {
  const sourceFiles = listFiles(source);
  const targetFiles = listFiles(target);
  if (JSON.stringify(sourceFiles) !== JSON.stringify(targetFiles))
    throw new Error("dist/assets 文件列表必须与 assets 完全一致");
  for (const relative of sourceFiles)
    if (!fs.readFileSync(path.join(source, relative)).equals(
      fs.readFileSync(path.join(target, relative)),
    ))
      throw new Error(`dist/assets 文件内容不一致：${relative}`);
}

function listFiles(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    return entry.isDirectory()
      ? listFiles(path.join(directory, entry.name), relative)
      : [relative];
  }).sort();
}
