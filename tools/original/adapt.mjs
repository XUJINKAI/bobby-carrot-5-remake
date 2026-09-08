import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMapDocument } from "@bobby/model";
import {
  campaignLevelId,
  campaignLevelName,
  campaignSequenceForChapter,
  specialSceneIdForSource,
} from "./public-ids.mjs";
import {
  OFFICIAL_RUNTIME_ASSET_SOURCES,
  RELEASES,
  SOURCE_TILE_SIZE,
} from "./source-definitions.mjs";
import { adaptDecodedMap } from "./entity-adapter.mjs";
import { deriveOriginalWinCondition } from "./win-condition.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const decoded = path.join(root, "original/decoded");
const adapted = path.join(root, "original/adapted");
const mapsRoot = path.join(adapted, "maps");
const releaseOrder = new Map(
  RELEASES.map((release) => [release.id, release.order]),
);
const specialLabels = {
  "beaver-shop": "Beaver Shop",
  "cloud-9": "Cloud 9",
  "dream-machine": "Dream Machine",
  "dreamland-reward": "Dreamland Reward",
  "campaign-intro": "Adventure Welcome",
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

fs.rmSync(mapsRoot, { recursive: true, force: true });
fs.mkdirSync(mapsRoot, { recursive: true });

const sourceIndex = readJson(path.join(decoded, "source-index.json"));
if (sourceIndex.schemaVersion !== 1)
  throw new Error("Original decoded source-index.json schemaVersion 必须为 1");

const chapters = [];
const maps = [];
const documents = new Map();

for (const release of sourceIndex.releases) {
  const order = releaseOrder.get(release.id);
  if (order === undefined) throw new Error(`未知 Original release：${release.id}`);
  for (const pack of release.packs) {
    if (String(pack.packFile) === "00") continue;
    if (![1, 2, 3].includes(pack.packType))
      throw new Error(
        `${release.id}/${pack.packFile}: packType 必须为 1~3`,
      );
    const chapter = sourceChapterNumber(order, pack.packFile);
    const mapIds = campaignSequenceForChapter(chapter);
    chapters.push({
      id: String(chapter),
      number: chapter,
      name: pack.title,
      description: pack.description ?? "",
      difficulty: pack.packType,
      maps: mapIds,
    });

    for (
      let sourceLevelIndex = 1;
      sourceLevelIndex <= 12;
      sourceLevelIndex += 1
    ) {
      const sourceName = `${pack.packFile}-${String(sourceLevelIndex).padStart(2, "0")}.json`;
      const source = readJson(
        path.join(decoded, release.id, "levels", sourceName),
      );
      if (
        source.schemaVersion !== 1 ||
        source.terrainEncoding !== "semantic-row-major"
      )
        throw new Error(`${release.id}/${sourceName}: decoded map 合同无效`);
      const id = campaignLevelId(chapter, sourceLevelIndex);
      const bonusOrdinal =
        sourceLevelIndex === 11 ? 1 : sourceLevelIndex === 12 ? 2 : null;
      const kind = bonusOrdinal === null ? "level" : "bonus";
      const sourceRef = sourceReference(release, source, sourceName);
      const document = createMapDocument(
        source,
        {
          name: campaignLevelName(sourceLevelIndex),
        },
        bonusOrdinal === null ? {} : { music: "bonus" },
      );
      documents.set(id, document);
      maps.push({
        id,
        chapter: String(chapter),
        kind,
        bonusOrdinal,
        sourceLevelIndex,
        source: sourceRef,
        path: `maps/${id}.json`,
      });
    }
  }
}

chapters.sort((left, right) => left.number - right.number);
if (chapters.length !== 40)
  throw new Error(`Original 应包含 40 章，实际 ${chapters.length}`);

const playerOrder = chapters.flatMap((chapter) => chapter.maps);
if (playerOrder.length !== 480)
  throw new Error(
    `Original 应包含 480 张 Campaign map，实际 ${playerOrder.length}`,
  );
const mapById = new Map(maps.map((map) => [map.id, map]));
const orderedMaps = playerOrder.map((id) => {
  const map = mapById.get(id);
  if (!map) throw new Error(`缺少 Original map metadata：${id}`);
  return map;
});
for (const id of playerOrder) {
  const document = documents.get(id);
  if (!document) throw new Error(`缺少 adapted map：${id}`);
  writeJson(path.join(mapsRoot, `${id}.json`), document);
}

const specialScenes = buildSpecialScenes(sourceIndex, documents);
for (const scene of specialScenes) {
  const document = documents.get(scene.id);
  if (!document) throw new Error(`缺少 Special Scene：${scene.id}`);
  writeJson(path.join(mapsRoot, `${scene.id}.json`), document);
}

copyRuntimeAssets();
writeJson(path.join(adapted, "catalog.json"), {
  schemaVersion: 1,
  chapters,
  maps: orderedMaps,
  specialScenes,
  art: {
    tileSize: SOURCE_TILE_SIZE,
    basePath: "art/hd",
  },
});
console.log("构建 Original Adapter：40 章 / 480 Campaign map / 5 Special Scene。");

function buildSpecialScenes(index, target) {
  const base = index.releases.find((release) => release.id === "base");
  const pack = base?.packs.find((item) => String(item.packFile) === "00");
  if (!base || !pack || pack.levelCount !== 5)
    throw new Error("Base/00.dat 必须包含 5 个 Special Scene");
  const result = [];
  for (
    let sourceLevelIndex = 1;
    sourceLevelIndex <= 5;
    sourceLevelIndex += 1
  ) {
    const sourceName = `00-${String(sourceLevelIndex).padStart(2, "0")}.json`;
    const source = readJson(path.join(decoded, "base", "levels", sourceName));
    if (source.schemaVersion !== 1)
      throw new Error(`base/${sourceName}: decoded map schemaVersion 必须为 1`);
    const id = specialSceneIdForSource(sourceLevelIndex);
    target.set(
      id,
      createMapDocument(source, {
        name: specialLabels[id] ?? id,
      }),
    );
    result.push({
      id,
      name: specialLabels[id] ?? id,
      sourceLevelIndex,
      source: sourceReference(base, source, sourceName),
      path: `maps/${id}.json`,
    });
  }
  return result;
}

function createMapDocument(source, meta, options = {}) {
  const canonical = adaptDecodedMap(source);
  const win = deriveOriginalWinCondition(canonical);
  return parseMapDocument({
    schemaVersion: 1,
    meta,
    ...options,
    ...(win ? { rules: { win } } : {}),
    ...canonical,
  });
}

function sourceReference(release, source, sourceName) {
  return {
    release: release.id,
    releaseLabel: release.label,
    packFile: source.source.packFile,
    packTitle: source.source.packTitle,
    packDescription: source.source.packDescription ?? "",
    levelIndex: source.source.levelIndex,
    recordSha256: source.recordSha256,
    decodedPath: `${release.id}/levels/${sourceName}`,
  };
}

function sourceChapterNumber(order, packFile) {
  const local = Number(packFile);
  if (!Number.isInteger(local) || local < 1 || local > 4)
    throw new Error(`无效 Original packFile：${String(packFile)}`);
  const chapter = order * 4 + local;
  if (chapter < 1 || chapter > 40)
    throw new Error(`Original chapter 超出 1~40：${chapter}`);
  return chapter;
}

function copyRuntimeAssets() {
  const artOut = path.join(adapted, "art", "hd");
  fs.rmSync(artOut, { recursive: true, force: true });
  fs.mkdirSync(artOut, { recursive: true });
  copyRuntimeAssetCategory(OFFICIAL_RUNTIME_ASSET_SOURCES.artwork, artOut);
}

function copyRuntimeAssetCategory(rule, outputDir) {
  const sourceRoot = path.join(
    root,
    "original/extracted",
    rule.defaultRelease,
  );
  const names = fs
    .readdirSync(sourceRoot)
    .filter((name) => name.toLowerCase().endsWith(rule.extension))
    .sort();
  for (const name of names) {
    const release = rule.overrides[name] ?? rule.defaultRelease;
    const source = path.join(root, "original/extracted", release, name);
    if (!fs.existsSync(source))
      throw new Error(`运行时资产来源不存在：${release}/${name}`);
    copy(source, path.join(outputDir, name));
  }
}
