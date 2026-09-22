import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareCustomCollections } from "../custom/prepare.mjs";
import {
  originalExploreFilters,
  originalExploreMapFilters,
} from "../original/explore-filter-tags.mjs";
import {
  inspectAssetsPrepareCache,
  invalidateAssetsPrepareCache,
  writeAssetsPrepareCache,
} from "./assets-cache.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const original = path.join(root, "original");
const assets = path.join(root, "assets");
const originalCollection = {
  id: "original",
  name: "原版关卡",
  description:
    "原版 400 个关卡、80 个奖励关、及 5 个特殊场景。",
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function rebuildAssets(options = {}) {
  for (const directory of [
    "original/extracted",
    "original/decoded",
    "original/adapted",
    "assets",
  ])
    cleanUntracked(directory);
  prepareAssets({ ...options, force: true });
}

export function prepareAssets({
  includeDevCollections = false,
  force = false,
} = {}) {
  const cache = inspectAssetsPrepareCache({ includeDevCollections });
  if (!force && cache.hit) {
    console.log(
      `资产准备缓存命中：${cache.snapshot.inputs.length} 个输入未变化，跳过内容生成。`,
    );
    return;
  }
  const reason = force ? "请求完整重建" : cache.reason;
  console.log(`资产准备缓存未命中：${reason}。`);
  invalidateAssetsPrepareCache();
  run(process.execPath, ["tools/original/extract.mjs"]);
  run(process.execPath, ["tools/original/decode.mjs"]);
  run(process.execPath, ["tools/original/adapt.mjs"]);
  run(process.execPath, ["tools/original/adventure-catalog.mjs"]);
  fs.mkdirSync(assets, { recursive: true });
  run(process.execPath, ["tools/custom/loma-pushbox.mjs"]);
  run(process.execPath, ["tools/custom/novoban-pushbox.mjs"]);
  const customCollections = prepareCustomCollections({
    development: includeDevCollections,
  });
  buildOriginalCollection();
  buildCollectionDiscoveryIndex([
    { id: originalCollection.id, name: originalCollection.name },
    ...customCollections,
  ]);
  buildAdventureIndex();
  fs.rmSync(path.join(assets, "art/hd"), { recursive: true, force: true });
  copyTree(path.join(original, "adapted/art"), path.join(assets, "art"));
  const result = writeAssetsPrepareCache(cache.snapshot, {
    includeDevCollections,
  });
  if (result.written) {
    console.log(
      `资产准备缓存已更新：${result.inputCount} 个输入，${result.outputCount} 个生成文件。`,
    );
  } else {
    console.log(`资产准备缓存未写入：${result.reason}。`);
  }
}

function buildOriginalCollection() {
  const catalog = readJson(path.join(original, "adapted/catalog.json"));
  const target = path.join(assets, "maps/original");
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  const maps = catalog.maps.map((entry) => {
    const document = readJson(path.join(original, "adapted", entry.path));
    fs.writeFileSync(
      path.join(target, `${entry.id}.json`),
      `${JSON.stringify(document, null, 2)}\n`,
    );
    return {
      id: entry.id,
      name: document.meta.name,
      description: "",
      chapter: entry.chapter,
      filters: originalExploreMapFilters(document),
    };
  });
  for (const scene of catalog.specialScenes) {
    const document = readJson(path.join(original, "adapted", scene.path));
    fs.writeFileSync(
      path.join(target, `${scene.id}.json`),
      `${JSON.stringify(document, null, 2)}\n`,
    );
    maps.push({
      id: scene.id,
      name: document.meta.name,
      description: "",
      chapter: "special-scenes",
      filters: originalExploreMapFilters(document),
    });
  }
  fs.writeFileSync(
    path.join(target, "index.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      name: originalCollection.name,
      description: originalCollection.description,
      cardSize: "small",
      filters: originalExploreFilters(),
      chapters: catalog.chapters.map((chapter) => ({
        id: chapter.id,
        name: `${chapter.id} · ${chapter.name}`,
        description: chapter.description,
        difficulty: chapter.difficulty,
      })).concat({
        id: "special-scenes",
        name: "Special Scenes",
        description: "Beaver Shop、Cloud 9、Dream Machine、Dreamland Reward 与 Campaign Intro。",
      }),
      maps,
    }, null, 2)}\n`,
  );
}

function buildCollectionDiscoveryIndex(collections) {
  const target = path.join(assets, "maps/index.json");
  fs.writeFileSync(
    target,
    `${JSON.stringify({ schemaVersion: 1, collections }, null, 2)}\n`,
  );
  console.log(`构建 Collection discovery index：${collections.length} 个集合。`);
}

function buildAdventureIndex() {
  const source = path.join(original, "adapted/adventure.json");
  const target = path.join(assets, "adventure/index.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function cleanUntracked(directory) {
  run("git", ["clean", "-fdX", "--", directory]);
}

function copyTree(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  prepareAssets();
