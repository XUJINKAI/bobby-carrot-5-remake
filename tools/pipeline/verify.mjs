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

const collectionsIndex = readJson("assets/maps/index.json");
assertSchemaV1(collectionsIndex, "assets/maps/index.json");
if (!collectionsIndex.collections.some((collection) => collection.id === "original"))
  throw new Error("Runtime collection index 必须包含 original");

const cardSizes = new Set(["small", "medium", "big"]);
const collectionIndexes = collectionsIndex.collections.map((summary) => {
  const relative = `assets/maps/${summary.id}/index.json`;
  const collection = readJson(relative);
  assertSchemaV1(collection, relative);
  if (
    collection.id !== summary.id ||
    !cardSizes.has(collection.cardSize) ||
    !Array.isArray(collection.filters) ||
    !Array.isArray(collection.chapters) ||
    !Array.isArray(collection.maps)
  )
    throw new Error(`${relative}: collection 合同不完整`);
  for (const map of collection.maps) {
    const mapRelative = `assets/maps/${collection.id}/${map.id}.json`;
    const document = readJson(mapRelative);
    assertMapDocument(document, mapRelative, map.id);
  }
  return collection;
});

const original = collectionIndexes.find((collection) => collection.id === "original");
if (!original) throw new Error("缺少 Original collection index");
if (original.cardSize !== "small")
  throw new Error("Original collection cardSize 必须为 small");
if (original.chapters.length !== 40 || original.maps.length !== 480)
  throw new Error("Original collection 必须包含 40 章 / 480 张 Campaign map");
if (original.filters.length === 0)
  throw new Error("Original collection 必须提供 Explore filters");
const pushbox = collectionIndexes.find((collection) => collection.id === "pushbox");
if (pushbox?.cardSize !== "medium")
  throw new Error("Pushbox collection cardSize 必须为 medium");
const testCollection = collectionIndexes.find((collection) => collection.id === "test");
if (testCollection?.cardSize !== "big")
  throw new Error("Test collection cardSize 必须为 big");
const expectedFirstChapter = [
  "1-1",
  "1-2",
  "1-3",
  "1-bonus-1",
  "1-4",
  "1-5",
  "1-6",
  "1-bonus-2",
  "1-7",
  "1-8",
  "1-9",
  "1-10",
];
const actualFirstChapter = original.maps
  .filter((map) => map.chapter === "1")
  .map((map) => map.id);
if (JSON.stringify(actualFirstChapter) !== JSON.stringify(expectedFirstChapter))
  throw new Error(
    `Original Chapter 1 Explore 顺序错误：${actualFirstChapter.join(",")}`,
  );
for (const map of original.maps) {
  const relative = `assets/maps/original/${map.id}.json`;
  const document = readJson(relative);
  assertOriginalWinRule(document, relative);
}
assertNext("1-3", "1-bonus-1");
assertNext("1-bonus-1", "1-4");
assertNext("1-6", "1-bonus-2");
assertNext("1-bonus-2", "1-7");
assertNext("1-10", "2-1");

const adventure = readJson("assets/adventure/index.json");
assertSchemaV1(adventure, "assets/adventure/index.json");
if (adventure.chapters.length !== 40)
  throw new Error("Adventure index 必须包含 40 章");
const adventureLevels = adventure.chapters.flatMap((chapter) => chapter.levels);
if (adventureLevels.length !== 480 || adventure.specialScenes.length !== 5)
  throw new Error("Adventure index 必须包含 480 个 Campaign node / 5 Special Scene");
for (const chapter of adventure.chapters) {
  const exploreIds = original.maps
    .filter((map) => map.chapter === chapter.id)
    .map((map) => map.id);
  const adventureIds = chapter.levels.map((level) => level.id);
  if (JSON.stringify(exploreIds) !== JSON.stringify(adventureIds))
    throw new Error(`Explore / Adventure Chapter ${chapter.id} 顺序不一致`);
}
for (const scene of adventure.specialScenes) {
  const ref = parseMapRef(scene.map);
  if (!ref) throw new Error(`无效 Adventure Special Scene map ref：${scene.map}`);
  const relative = `assets/maps/${ref.collection}/${ref.id}.json`;
  assertMapDocument(readJson(relative), relative, ref.id);
}

for (const file of [
  "dist/assets/maps/index.json",
  "dist/assets/maps/original/index.json",
  "dist/assets/maps/original/1-1.json",
  "dist/assets/maps/original/1-bonus-1.json",
  "dist/assets/adventure/index.json",
])
  if (!fs.existsSync(path.join(root, file)))
    throw new Error(`缺少构建产物：${file}`);
if (fs.existsSync(path.join(root, "dist/dat")))
  throw new Error("生产产物不应包含 DAT 模块");
for (const obsolete of ["web/dist-src", "web/dist-vite"])
  if (fs.existsSync(path.join(root, obsolete)))
    throw new Error(`Web 不应生成中间编译目录：${obsolete}`);
assertSameTree(path.join(root, "assets"), path.join(root, "dist/assets"));

console.log(
  "verify: OK — schema v1、MapDocument、collection cardSize、Original win rule、Explore/Adventure 顺序、测试、构建与 DAT-free runtime 检查通过。",
);

function assertNext(id, expected) {
  const document = readJson(`assets/maps/original/${id}.json`);
  if (document.meta.next !== expected)
    throw new Error(`${id}.meta.next 应为 ${expected}，实际 ${document.meta.next}`);
}

function assertSchemaV1(value, relative) {
  if (!value || typeof value !== "object" || value.schemaVersion !== 1)
    throw new Error(`${relative}: schemaVersion 必须严格为 1`);
}

function assertMapDocument(document, relative, expectedId) {
  assertSchemaV1(document, relative);
  if (
    !document.meta ||
    document.meta.id !== expectedId ||
    typeof document.meta.name !== "string" ||
    !Array.isArray(document.terrain) ||
    !Array.isArray(document.objects)
  )
    throw new Error(`${relative}: MapDocument 合同不完整`);
}

function assertOriginalWinRule(document, relative) {
  const conditions = document.rules?.win?.conditions;
  if (!Array.isArray(conditions))
    throw new Error(`${relative}: Original rules.win.conditions 缺失`);
  const pushGoal = conditions.find(
    (condition) =>
      condition?.type === "fill-all" &&
      (condition.terrainTrait === "push-goal" ||
        condition.objectTrait === "pushable"),
  );
  if (pushGoal)
    throw new Error(`${relative}: Original 不应包含 Pushbox fill-all 获胜条件`);
}

function parseMapRef(value) {
  if (typeof value !== "string") return null;
  const [collection, id, extra] = value.split("/");
  return collection && id && extra === undefined ? { collection, id } : null;
}

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
