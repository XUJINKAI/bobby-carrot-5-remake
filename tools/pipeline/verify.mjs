import fs from "node:fs";
import path from "node:path";
import { root, run } from "../lib/fs.mjs";

let parseMapDocument;

run(process.execPath, ["tools/pipeline/source-quality.mjs"]);
const packageJson = readJson("package.json");
for (const [name, command] of Object.entries(packageJson.scripts ?? {}))
  if (!String(command).startsWith("node tools/cli.mjs "))
    throw new Error(`npm script 必须是 tools/cli.mjs alias：${name}`);
run(process.execPath, ["tools/cli.mjs", "assets", "prepare"]);
for (const file of [
  "custom-maps/loma-pushbox/01/01-01.json",
  "custom-maps/novoban-pushbox/01.json",
])
  run("git", ["check-ignore", "--quiet", file]);
run(process.execPath, ["tools/cli.mjs", "test"]);
run(process.execPath, ["tools/cli.mjs", "build"]);
({ parseMapDocument } = await import("@bobby/model"));
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
    Object.hasOwn(collection, "id") ||
    !cardSizes.has(collection.cardSize) ||
    !Array.isArray(collection.filters) ||
    !Array.isArray(collection.chapters) ||
    !Array.isArray(collection.maps)
  )
    throw new Error(`${relative}: collection 合同不完整`);
  for (const map of collection.maps) {
    const mapRelative = `assets/maps/${summary.id}/${map.id}.json`;
    const document = readJson(mapRelative);
    assertMapDocument(document, mapRelative);
  }
  return { id: summary.id, ...collection };
});

const original = collectionIndexes.find((collection) => collection.id === "original");
if (!original) throw new Error("缺少 Original collection index");
if (original.cardSize !== "small")
  throw new Error("Original collection cardSize 必须为 small");
if (original.chapters.length !== 40 || original.maps.length !== 480)
  throw new Error("Original collection 必须包含 40 章 / 480 张 Campaign map");
if (original.filters.length === 0)
  throw new Error("Original collection 必须提供 Explore filters");
const novoban = collectionIndexes.find(
  (collection) => collection.id === "novoban-pushbox",
);
if (novoban?.cardSize !== "medium")
  throw new Error("Novoban collection cardSize 必须为 medium");
const engineLab = collectionIndexes.find(
  (collection) => collection.id === "engine-lab",
);
if (engineLab?.cardSize !== "big")
  throw new Error("Engine Lab collection cardSize 必须为 big");
assertLomaCollection(collectionIndexes);
assertNovobanCollection(collectionIndexes);

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
  assertOriginalStartContract(document, relative);
  assertOriginalMusicContract(document, relative);
  assertOriginalWinRule(document, relative);
}
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
  const document = readJson(relative);
  assertMapDocument(document, relative);
  if (ref.collection === "original") {
    assertOriginalStartContract(document, relative);
    assertOriginalMusicContract(document, relative);
  }
}

for (const file of [
  "dist/assets/maps/index.json",
  "dist/assets/maps/original/index.json",
  "dist/assets/maps/original/1-1.json",
  "dist/assets/maps/original/1-bonus-1.json",
  "dist/assets/maps/loma-pushbox/index.json",
  "dist/assets/maps/loma-pushbox/01-01.json",
  "dist/assets/maps/novoban-pushbox/index.json",
  "dist/assets/maps/novoban-pushbox/01.json",
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
  "verify: OK — schema v1 Entity Map、MapDocument、Bobby/Start、collection cardSize、LOMA/Novoban generation、win rules、Explore/Adventure 顺序、测试、构建与 DAT-free runtime 检查通过。",
);

function assertLomaCollection(collections) {
  const loma = collections.find((collection) => collection.id === "loma-pushbox");
  if (!loma) throw new Error("缺少 LOMA Pushbox collection");
  if (loma.cardSize !== "small")
    throw new Error("LOMA Pushbox collection cardSize 必须为 small");
  if (loma.chapters.length !== 10 || loma.maps.length !== 137)
    throw new Error("LOMA Pushbox 必须包含 10 个 Pattern / 137 张地图");
  const expectedChapters = Array.from({ length: 10 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );
  if (
    JSON.stringify(loma.chapters.map((chapter) => chapter.id)) !==
    JSON.stringify(expectedChapters)
  )
    throw new Error("LOMA Pushbox chapter 必须保持 01~10 Pattern 顺序");
  if (loma.maps[0]?.id !== "01-01" || loma.maps.at(-1)?.id !== "10-13")
    throw new Error("LOMA Pushbox map 顺序必须保持源文件编号");
  for (const map of loma.maps) {
    if (map.chapter !== map.id.slice(0, 2))
      throw new Error(`${map.id}: LOMA chapter 与源 Title pattern 不一致`);
    const relative = `assets/maps/loma-pushbox/${map.id}.json`;
    const document = readJson(relative);
    if (typeof document.meta.author !== "string" || !document.meta.author)
      throw new Error(`${relative}: 必须保留 LOMA Author`);
    const { pushables, goals } = assertPushboxWinRule(document, relative);
    if (pushables !== 3 || goals !== 3)
      throw new Error(`${relative}: LOMA 必须保持 3 箱 / 3 目标`);
  }
}

function assertNovobanCollection(collections) {
  const novoban = collections.find(
    (collection) => collection.id === "novoban-pushbox",
  );
  if (!novoban) throw new Error("缺少 Novoban collection");
  if (novoban.cardSize !== "medium")
    throw new Error("Novoban collection cardSize 必须为 medium");
  if (novoban.chapters.length !== 0 || novoban.maps.length !== 50)
    throw new Error("Novoban 必须是无章节的 50 张地图 collection");
  if (novoban.maps[0]?.id !== "01" || novoban.maps.at(-1)?.id !== "50")
    throw new Error("Novoban map 顺序必须保持源文件 01~50");
  const boxCounts = new Set();
  for (const map of novoban.maps) {
    if (map.chapter !== undefined)
      throw new Error(`${map.id}: Novoban 不应生成 chapter`);
    const relative = `assets/maps/novoban-pushbox/${map.id}.json`;
    const document = readJson(relative);
    if (document.meta.author !== "François Marques")
      throw new Error(`${relative}: 必须保留 François Marques 作者信息`);
    const { pushables, goals } = assertPushboxWinRule(document, relative);
    if (pushables !== goals || goals <= 0)
      throw new Error(`${relative}: Novoban 箱子数必须与目标数一致`);
    boxCounts.add(pushables);
  }
  if (boxCounts.size <= 1)
    throw new Error("Novoban 应保留不同关卡的可变箱子数量");

  const surrounded = readJson("assets/maps/novoban-pushbox/07.json");
  const bobby = surrounded.entities.find((entity) => entity.type === "bobby");
  if (
    !bobby ||
    !surrounded.entities.some(
      (entity) =>
        entity.type === "push-goal" && entity.x === bobby.x && entity.y === bobby.y,
    )
  )
    throw new Error("Novoban 07 必须把 XSB + 保留为 Bobby 位于 push-goal 上");
}

function assertPushboxWinRule(document, relative) {
  const expected = {
    type: "fill-all",
    target: "push-goal",
    filler: "pushable",
  };
  if (JSON.stringify(document.rules?.win) !== JSON.stringify(expected))
    throw new Error(`${relative}: 获胜条件必须只有 fill-all push-goal`);
  const bobbies = document.entities.filter((entity) => entity.type === "bobby");
  if (bobbies.length !== 1)
    throw new Error(`${relative}: Sokoban 必须恰好包含一个 Bobby Entity`);
  if (document.entities.some((entity) => entity.type === "start"))
    throw new Error(`${relative}: Sokoban 不使用 Start surface`);
  const pushables = document.entities.filter((entity) =>
    entity.type === "pushable-rock",
  ).length;
  const goals = document.entities.filter((entity) => entity.type === "push-goal").length;
  if (document.entities.some((entity) => entity.type === "exit"))
    throw new Error(`${relative}: Sokoban collection 不使用 exit 获胜条件`);
  return { pushables, goals };
}

function assertSchemaV1(value, relative) {
  if (!value || typeof value !== "object" || value.schemaVersion !== 1)
    throw new Error(`${relative}: schemaVersion 必须严格为 1`);
}

function assertMapDocument(document, relative) {
  try {
    parseMapDocument(document);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`${relative}: ${detail}`, { cause });
  }
}

function assertOriginalStartContract(document, relative) {
  const starts = document.entities.filter((entity) => entity.type === "start");
  const bobbies = document.entities.filter((entity) => entity.type === "bobby");
  if (starts.length !== 1 || bobbies.length !== 1)
    throw new Error(`${relative}: Original 必须恰好包含一个 Start surface 与一个 Bobby`);
  if (starts[0].x !== bobbies[0].x || starts[0].y !== bobbies[0].y)
    throw new Error(`${relative}: Original 初始 Bobby 必须与 Start surface 同格`);
}

function assertOriginalMusicContract(document, relative) {
  if (Object.hasOwn(document, "music"))
    throw new Error(`${relative}: Original MapDocument 不应持久化 music`);
}

function assertOriginalWinRule(document, relative) {
  const types = new Set(document.entities.map((entity) => entity.type));
  const exit = types.has("exit") ? { type: "reach", target: "exit" } : null;
  let expected;
  if (types.has("golden-carrot")) {
    const goldenCarrot = { type: "reach", target: "golden-carrot" };
    expected = exit
      ? {
          type: "any",
          conditions: [goldenCarrot, exit],
        }
      : goldenCarrot;
  } else if (types.has("carrot")) {
    const carrots = { type: "collect-all", target: "carrot" };
    expected = exit ? { type: "all", conditions: [carrots, exit] } : carrots;
  } else if (types.has("egg-nest")) {
    const eggs = {
      type: "fill-all",
      target: "egg-nest",
      filler: "egg",
    };
    expected = exit ? { type: "all", conditions: [eggs, exit] } : eggs;
  } else if (exit) {
    expected = exit;
  } else {
    throw new Error(`${relative}: Original Campaign map 缺少可识别获胜目标`);
  }
  if (JSON.stringify(document.rules?.win) !== JSON.stringify(expected))
    throw new Error(`${relative}: Original rules.win 与 canonical Entity 目标不一致`);
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
    if (
      !fs
        .readFileSync(path.join(source, relative))
        .equals(fs.readFileSync(path.join(target, relative)))
    )
      throw new Error(`dist/assets 文件内容不一致：${relative}`);
}

function listFiles(directory, prefix = "") {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.join(prefix, entry.name);
      return entry.isDirectory()
        ? listFiles(path.join(directory, entry.name), relative)
        : [relative];
    })
    .sort();
}
