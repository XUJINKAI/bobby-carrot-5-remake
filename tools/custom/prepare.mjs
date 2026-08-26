import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const sourceRoot = path.join(root, "custom-maps");
const outputRoot = path.join(root, "assets/maps");
const cardSizes = new Set(["small", "medium", "big"]);
const manifest = JSON.parse(
  fs.readFileSync(path.join(sourceRoot, "collections.json"), "utf8"),
);

if (!Array.isArray(manifest))
  throw new Error("custom-maps/collections.json 必须是数组");

fs.mkdirSync(outputRoot, { recursive: true });
const ids = new Set();
const collections = manifest
  .map((entry) => buildCollection(entry))
  .filter((entry) => entry.visible)
  .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

fs.writeFileSync(
  path.join(outputRoot, "index.json"),
  `${JSON.stringify({
    schemaVersion: 1,
    collections: [
      {
        id: "original",
        name: "原版关卡",
        description: "Bobby Carrot 5 原版 40 章地图。",
        order: 0,
      },
      ...collections.map(({ id, name, description, order }) => ({
        id,
        name,
        description,
        order,
      })),
    ],
  }, null, 2)}\n`,
);

for (const collection of collections) writeCollection(collection);
console.log(
  `构建地图 Collection：${collections.length + 1} 个集合 / ${collections.reduce((sum, item) => sum + item.maps.length, 0)} 张自定义地图。`,
);

function buildCollection(entry) {
  if (!entry || typeof entry !== "object")
    throw new Error("collection 定义必须是对象");
  const {
    id,
    name,
    description,
    cardSize,
    order,
    visible = true,
    chapters: rawChapters = [],
  } = entry;
  if (!isSlug(id)) throw new Error(`无效 collection ID：${String(id)}`);
  if (ids.has(id)) throw new Error(`重复 collection ID：${id}`);
  ids.add(id);
  if (typeof name !== "string" || !name.trim())
    throw new Error(`${id}: name 不能为空`);
  if (typeof description !== "string")
    throw new Error(`${id}: description 必须是字符串`);
  if (!cardSizes.has(cardSize))
    throw new Error(`${id}: cardSize 必须是 small / medium / big`);
  if (!Number.isFinite(order)) throw new Error(`${id}: order 必须是数字`);
  if (typeof visible !== "boolean")
    throw new Error(`${id}: visible 必须是布尔值`);
  const chapters = validateChapters(id, rawChapters);
  const chapterIds = new Set(chapters.map((chapter) => chapter.id));
  const directory = path.join(sourceRoot, id);
  if (!fs.existsSync(directory)) throw new Error(`${id}: collection 目录不存在`);
  const maps = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((item) => item.isFile() && item.name.endsWith(".json"))
    .map((item) => readMap(id, directory, item.name, chapterIds))
    .sort((left, right) => left.id.localeCompare(right.id));
  if (maps.length === 0) throw new Error(`${id}: collection 至少需要一张地图`);
  return { id, name, description, cardSize, order, visible, chapters, maps };
}

function validateChapters(collectionId, value) {
  if (!Array.isArray(value)) throw new Error(`${collectionId}: chapters 必须是数组`);
  const chapterIds = new Set();
  return value.map((chapter) => {
    if (!chapter || typeof chapter !== "object")
      throw new Error(`${collectionId}: chapter 必须是对象`);
    const { id, name, description = "" } = chapter;
    if (!isSlug(id)) throw new Error(`${collectionId}: 无效 chapter ID：${String(id)}`);
    if (chapterIds.has(id)) throw new Error(`${collectionId}: 重复 chapter ID：${id}`);
    chapterIds.add(id);
    if (typeof name !== "string" || !name.trim())
      throw new Error(`${collectionId}/${id}: chapter name 不能为空`);
    if (typeof description !== "string")
      throw new Error(`${collectionId}/${id}: chapter description 必须是字符串`);
    return { id, name, description };
  });
}

function readMap(collectionId, directory, filename, chapterIds) {
  const id = path.basename(filename, ".json");
  if (!isSlug(id)) throw new Error(`${collectionId}: 无效地图 ID：${id}`);
  const level = JSON.parse(fs.readFileSync(path.join(directory, filename), "utf8"));
  if (level.schemaVersion !== 1)
    throw new Error(`${collectionId}/${id}: schemaVersion 必须为 1`);
  if (typeof level.name !== "string" || !level.name.trim())
    throw new Error(`${collectionId}/${id}: name 不能为空`);
  if (level.chapter !== undefined) {
    if (typeof level.chapter !== "string" || !chapterIds.has(level.chapter))
      throw new Error(`${collectionId}/${id}: chapter ${String(level.chapter)} 未在 collection 中定义`);
  }
  return {
    id,
    name: level.name,
    description: typeof level.description === "string" ? level.description : "",
    author: typeof level.author === "string" ? level.author : undefined,
    chapter: level.chapter,
    level,
  };
}

function writeCollection(collection) {
  const target = path.join(outputRoot, collection.id);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  const maps = collection.maps.map((entry, index) => {
    const next = collection.maps[index + 1]?.id;
    const {
      schemaVersion: _schemaVersion,
      name: _name,
      author: _author,
      description: _description,
      chapter: _chapter,
      ...levelMap
    } = entry.level;
    const meta = {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      ...(entry.author ? { author: entry.author } : {}),
      ...(next ? { next } : {}),
    };
    fs.writeFileSync(
      path.join(target, `${entry.id}.json`),
      `${JSON.stringify({ schemaVersion: 1, meta, ...levelMap }, null, 2)}\n`,
    );
    return {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      ...(entry.chapter ? { chapter: entry.chapter } : {}),
    };
  });
  fs.writeFileSync(
    path.join(target, "index.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      id: collection.id,
      name: collection.name,
      description: collection.description,
      cardSize: collection.cardSize,
      filters: [],
      chapters: collection.chapters,
      maps,
    }, null, 2)}\n`,
  );
}

function isSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
