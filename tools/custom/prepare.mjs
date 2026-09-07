import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const sourceRoot = path.join(root, "custom-maps");
const outputRoot = path.join(root, "assets/maps");
const cardSizes = new Set(["small", "medium", "big"]);
const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "collections.json"), "utf8"));

if (!manifest || typeof manifest !== "object" || manifest.schemaVersion !== 1 || !Array.isArray(manifest.collections))
  throw new Error("custom-maps/collections.json 必须是 schemaVersion: 1 的 collection manifest");

fs.mkdirSync(outputRoot, { recursive: true });
const ids = new Set();
const collections = manifest.collections.map(buildCollection);

fs.writeFileSync(
  path.join(outputRoot, "index.json"),
  `${JSON.stringify({
    schemaVersion: 1,
    collections: [
      { id: "original", name: "原版关卡", description: "Bobby Carrot 5 原版 40 章地图。" },
      ...collections.map(({ id, name, description }) => ({
        id,
        name,
        ...(description ? { description } : {}),
      })),
    ],
  }, null, 2)}\n`,
);

for (const collection of collections) writeCollection(collection);
console.log(`构建地图 Collection：${collections.length + 1} 个集合 / ${collections.reduce((sum, item) => sum + item.maps.length, 0)} 张自定义地图。`);

function buildCollection(entry) {
  if (!entry || typeof entry !== "object") throw new Error("collection 定义必须是对象");
  const { id, name, description = "", cardSize = "medium", chapters: rawChapters = {} } = entry;
  if (!isSlug(id)) throw new Error(`无效 collection ID：${String(id)}`);
  if (ids.has(id)) throw new Error(`重复 collection ID：${id}`);
  ids.add(id);
  if (typeof name !== "string" || !name.trim()) throw new Error(`${id}: name 不能为空`);
  if (typeof description !== "string") throw new Error(`${id}: description 必须是字符串`);
  if (!cardSizes.has(cardSize)) throw new Error(`${id}: cardSize 必须是 small / medium / big`);
  const chapters = validateChapters(id, rawChapters);
  const directory = path.join(sourceRoot, id);
  if (!fs.existsSync(directory)) throw new Error(`${id}: collection 目录不存在`);
  const maps = readCollectionMaps(id, directory, chapters);
  if (maps.length === 0) throw new Error(`${id}: collection 至少需要一张地图`);
  return { id, name, description, cardSize, chapters, maps };
}

function validateChapters(collectionId, value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${collectionId}: chapters 必须是以目录 ID 为 key 的对象`);
  return Object.entries(value).map(([id, chapter]) => {
    if (!isSlug(id)) throw new Error(`${collectionId}: 无效 chapter 目录 ID：${id}`);
    if (!chapter || typeof chapter !== "object" || Array.isArray(chapter))
      throw new Error(`${collectionId}/${id}: chapter 必须是对象`);
    const { name = id, description = "" } = chapter;
    if (typeof name !== "string" || !name.trim()) throw new Error(`${collectionId}/${id}: chapter name 不能为空`);
    if (typeof description !== "string") throw new Error(`${collectionId}/${id}: chapter description 必须是字符串`);
    return { id, name, description };
  });
}

function readCollectionMaps(collectionId, directory, chapters) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const chapterIds = new Set(chapters.map((chapter) => chapter.id));
  for (const entry of entries) {
    if (entry.isDirectory() && !chapterIds.has(entry.name))
      throw new Error(`${collectionId}/${entry.name}: 目录未在 collection chapters 中定义`);
  }
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => ({ directory, filename: entry.name }));
  for (const chapter of chapters) {
    const chapterDirectory = path.join(directory, chapter.id);
    if (!fs.existsSync(chapterDirectory)) throw new Error(`${collectionId}/${chapter.id}: chapter 目录不存在`);
    files.push(...fs.readdirSync(chapterDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => ({ directory: chapterDirectory, filename: entry.name, chapter: chapter.id })));
  }
  const mapIds = new Set();
  return files.map((file) => readMap(collectionId, file))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((map) => {
      if (mapIds.has(map.id)) throw new Error(`${collectionId}: 重复地图 ID：${map.id}`);
      mapIds.add(map.id);
      return map;
    });
}

function readMap(collectionId, { directory, filename, chapter }) {
  const id = path.basename(filename, ".json");
  if (!isSlug(id)) throw new Error(`${collectionId}: 无效地图 ID：${id}`);
  const level = JSON.parse(fs.readFileSync(path.join(directory, filename), "utf8"));
  if (level.schemaVersion !== 1) throw new Error(`${collectionId}/${id}: schemaVersion 必须为 1`);
  if (!level.meta || typeof level.meta.name !== "string" || !level.meta.name.trim())
    throw new Error(`${collectionId}/${id}: meta.name 不能为空`);
  return {
    id,
    name: level.meta.name,
    description: typeof level.meta.description === "string" ? level.meta.description : "",
    ...(chapter ? { chapter } : {}),
    level,
  };
}

function writeCollection(collection) {
  const target = path.join(outputRoot, collection.id);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  for (const entry of collection.maps)
    fs.writeFileSync(path.join(target, `${entry.id}.json`), `${JSON.stringify(entry.level, null, 2)}\n`);
  fs.writeFileSync(
    path.join(target, "index.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      name: collection.name,
      ...(collection.description ? { description: collection.description } : {}),
      cardSize: collection.cardSize,
      filters: [],
      chapters: collection.chapters,
      maps: collection.maps.map((entry) => ({
        id: entry.id,
        name: entry.name,
        ...(entry.description ? { description: entry.description } : {}),
        ...(entry.chapter ? { chapter: entry.chapter } : {}),
      })),
    }, null, 2)}\n`,
  );
}

function isSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
