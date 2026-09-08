import fs from "node:fs";
import path from "node:path";
import { parseMapDocument } from "@bobby/model";
import { root } from "../lib/fs.mjs";
import { discoverCollectionSource } from "./collection-source.mjs";
import {
  isCollectionVisible,
  normalizeCollectionVisibility,
} from "./collection-visibility.mjs";

const sourceRoot = path.join(root, "custom-maps");
const outputRoot = path.join(root, "assets/maps");
const cardSizes = new Set(["small", "medium", "big"]);
const development = process.argv.includes("--dev");
const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "collections.json"), "utf8"));

if (!manifest || typeof manifest !== "object" || manifest.schemaVersion !== 1 || !Array.isArray(manifest.collections))
  throw new Error("custom-maps/collections.json 必须是 schemaVersion: 1 的 collection manifest");

fs.mkdirSync(outputRoot, { recursive: true });
const ids = new Set();
const collections = manifest.collections.map(buildCollection);
const visibleCollections = collections.filter((collection) =>
  isCollectionVisible(collection.visible, development),
);

fs.writeFileSync(
  path.join(outputRoot, "index.json"),
  `${JSON.stringify({
    schemaVersion: 1,
    collections: [
      {
        id: "original",
        name: "原版关卡",
        description: "Bobby Carrot 5 原版 400 个普通关卡、80 个 Bonus 奖励关与 5 个 Special Scene。",
      },
      ...visibleCollections.map(({ id, name, description }) => ({
        id,
        name,
        ...(description ? { description } : {}),
      })),
    ],
  }, null, 2)}\n`,
);

for (const collection of collections) writeCollection(collection);
console.log(
  `构建地图 Collection：${collections.length + 1} 个集合 / ${collections.reduce((sum, item) => sum + item.maps.length, 0)} 张自定义地图；当前索引展示 ${visibleCollections.length + 1} 个集合。`,
);

function buildCollection(entry) {
  if (!entry || typeof entry !== "object") throw new Error("collection 定义必须是对象");
  const {
    id,
    name,
    description = "",
    cardSize = "medium",
    chapters: chapterMetadata,
  } = entry;
  if (!isSlug(id)) throw new Error(`无效 collection ID：${String(id)}`);
  if (ids.has(id)) throw new Error(`重复 collection ID：${id}`);
  ids.add(id);
  if (typeof name !== "string" || !name.trim()) throw new Error(`${id}: name 不能为空`);
  if (typeof description !== "string") throw new Error(`${id}: description 必须是字符串`);
  if (!cardSizes.has(cardSize)) throw new Error(`${id}: cardSize 必须是 small / medium / big`);
  const visible = normalizeCollectionVisibility(entry.visible, id);
  const directory = path.join(sourceRoot, id);
  if (!fs.existsSync(directory)) throw new Error(`${id}: collection 目录不存在`);
  const { chapters, files } = discoverCollectionSource(id, directory, chapterMetadata);
  const maps = readCollectionMaps(id, files);
  if (maps.length === 0) throw new Error(`${id}: collection 至少需要一张地图`);
  return { id, name, description, cardSize, visible, chapters, maps };
}

function readCollectionMaps(collectionId, files) {
  const mapIds = new Set();
  return files.map((file) => readMap(collectionId, file))
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
    description: "",
    ...(chapter ? { chapter } : {}),
    level,
  };
}

function writeCollection(collection) {
  const target = path.join(outputRoot, collection.id);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  for (const entry of collection.maps)
    fs.writeFileSync(
      path.join(target, `${entry.id}.json`),
      `${JSON.stringify(parseMapDocument(entry.level), null, 2)}\n`,
    );
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
