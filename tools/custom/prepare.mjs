import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const sourceRoot = path.join(root, "custom-maps");
const outputRoot = path.join(root, "assets/maps");
const manifestPath = path.join(sourceRoot, "collections.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (!Array.isArray(manifest))
  throw new Error("custom-maps/collections.json 必须是数组");

fs.mkdirSync(outputRoot, { recursive: true });

const ids = new Set();
const collections = manifest
  .map((entry) => buildCollection(entry))
  .filter((entry) => entry.visible)
  .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

const catalog = {
  schemaVersion: 1,
  collections: [
    { id: "original", name: "原版关卡", order: 0 },
    ...collections.map(({ visible: _visible, maps: _maps, ...entry }) => entry),
  ],
};
fs.writeFileSync(
  path.join(outputRoot, "index.json"),
  `${JSON.stringify(catalog, null, 2)}\n`,
);
for (const collection of collections) {
  const { visible: _visible, ...index } = collection;
  fs.writeFileSync(
    path.join(outputRoot, collection.id, "index.json"),
    `${JSON.stringify({ schemaVersion: 1, ...index }, null, 2)}\n`,
  );
}
console.log(
  `构建地图 Collection：${catalog.collections.length} 个集合 / ${collections.reduce((sum, item) => sum + item.maps.length, 0)} 张自定义地图。`,
);

function buildCollection(entry) {
  if (!entry || typeof entry !== "object")
    throw new Error("collection 定义必须是对象");
  const { id, name, description, order, visible = true } = entry;
  if (!isSlug(id)) throw new Error(`无效 collection ID：${String(id)}`);
  if (ids.has(id)) throw new Error(`重复 collection ID：${id}`);
  ids.add(id);
  if (typeof name !== "string" || !name.trim())
    throw new Error(`${id}: name 不能为空`);
  if (typeof description !== "string")
    throw new Error(`${id}: description 必须是字符串`);
  if (!Number.isFinite(order)) throw new Error(`${id}: order 必须是数字`);
  if (typeof visible !== "boolean")
    throw new Error(`${id}: visible 必须是布尔值`);

  const directory = path.join(sourceRoot, id);
  if (!fs.existsSync(directory)) throw new Error(`${id}: collection 目录不存在`);
  fs.rmSync(path.join(outputRoot, id), { recursive: true, force: true });
  const maps = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((item) => item.isFile() && item.name.endsWith(".json"))
    .map((item) => buildMap(id, directory, item.name))
    .sort((left, right) => left.id.localeCompare(right.id));
  if (maps.length === 0) throw new Error(`${id}: collection 至少需要一张地图`);
  return { id, name, description, order, visible, maps };
}

function buildMap(collectionId, directory, filename) {
  const id = path.basename(filename, ".json");
  if (!isSlug(id)) throw new Error(`${collectionId}: 无效地图 ID：${id}`);
  const sourcePath = path.join(directory, filename);
  const level = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (level.schemaVersion !== 3)
    throw new Error(`${collectionId}/${id}: schemaVersion 必须为 3`);
  if (typeof level.name !== "string" || !level.name.trim())
    throw new Error(`${collectionId}/${id}: name 不能为空`);
  const targetDirectory = path.join(outputRoot, collectionId);
  fs.mkdirSync(targetDirectory, { recursive: true });
  fs.copyFileSync(sourcePath, path.join(targetDirectory, filename));
  return {
    id,
    name: level.name,
    description: typeof level.description === "string" ? level.description : "",
    path: `maps/${collectionId}/${filename}`,
  };
}

function isSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
