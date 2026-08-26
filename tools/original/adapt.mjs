import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OFFICIAL_RUNTIME_ASSET_SOURCES,
  RELEASES,
  SOURCE_TILE_SIZE,
} from "./source-definitions.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const decoded = path.join(root, "original/decoded");
const adapted = path.join(root, "original/adapted");
const generated = adapted;
const levelsRoot = path.join(adapted, "maps");

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
function publicReleaseId(releaseId) {
  if (releaseId === "base") return "base";
  const n = Number(releaseId.replace(/^up0?/, ""));
  return `up${n}`;
}
function publicLevelId(source) {
  const release = publicReleaseId(source.release);
  return `${release}-${Number(source.packFile)}-${source.levelIndex}`;
}

fs.rmSync(levelsRoot, { recursive: true, force: true });
fs.mkdirSync(levelsRoot, { recursive: true });

const byHash = new Map();
const canonical = [];
let totalSourceLevels = 0;

/**
 * 内部 canonical 编号只负责去重/存档兼容：
 * 1. Base/00 的 5 个公共教学关为 001~005；
 * 2. 再按 Base、UP1...UP9 的 01.dat~04.dat 顺序导入；
 * 3. 后续 release 重复携带的 00.dat 只追加 source。
 *
 * 玩家可见编号另用 publicId，例如 base-1-1、up3-4-12。
 */
for (const release of RELEASES) {
    const dir = path.join(decoded, release.id, "levels");
  const names = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();
  const ordered =
    release.id === "base"
      ? names
      : [
          ...names.filter((n) => !n.startsWith("00-")),
          ...names.filter((n) => n.startsWith("00-")),
        ];

  for (const name of ordered) {
    const level = readJson(path.join(dir, name));
    if (
      level.schemaVersion !== 2 ||
      level.terrainEncoding !== "semantic-row-major"
    ) {
      throw new Error(
        `Source level is not semantic schema v2: ${release.id}/${name}`,
      );
    }
    totalSourceLevels += 1;
    const sourceRef = {
      edition: level.source.edition,
      release: release.id,
      releaseLabel: release.label,
      packFile: level.source.packFile,
      packTitle: level.source.packTitle,
      packDescription: level.source.packDescription ?? "",
      levelIndex: level.source.levelIndex,
      decodedPath: `${release.id}/levels/${name}`,
    };
    const existing = byHash.get(level.recordSha256);
    if (existing) {
      existing.sources.push(sourceRef);
      continue;
    }

    const id = String(canonical.length + 1).padStart(3, "0");
    const item = {
      id,
      canonicalId: id,
      publicId: publicLevelId(sourceRef),
      number: canonical.length + 1,
      release: publicReleaseId(release.id),
      releaseSourceId: release.id,
      releaseLabel: release.label,
      chapter: Number(sourceRef.packFile),
      chapterTitle: sourceRef.packTitle,
      chapterDescription: sourceRef.packDescription ?? "",
      chapterLevel: sourceRef.levelIndex,
      recordSha256: level.recordSha256,
      width: level.width,
      height: level.height,
      dynamicSlots: level.dynamicSlots,
      objectCount: level.objects.length,
      primarySource: sourceRef,
      sources: [sourceRef],
      path: `maps/${id}.json`,
    };
    byHash.set(level.recordSha256, item);
    canonical.push(item);
    writeJson(path.join(levelsRoot, `${id}.json`), {
      ...level,
      schemaVersion: 3,
      objects: level.objects.map((object) =>
        isOriginalBonus(sourceRef) && object.type === "lock"
          ? {
              ...object,
              properties: {
                ...(object.properties ?? {}),
                timedChallengeMs: object.properties?.timedChallengeMs ?? "60000",
              },
            }
          : object,
      ),
      id,
      canonicalId: id,
      publicId: item.publicId,
      number: item.number,
      release: item.release,
      chapter: item.chapter,
      chapterTitle: item.chapterTitle,
      chapterLevel: item.chapterLevel,
      sources: item.sources,
    });
  }
}

function isOriginalBonus(source) {
  return source.packFile !== "00" && [11, 12].includes(Number(source.levelIndex));
}

// 重复教学关出现后，回写完整 source 列表。
for (const item of canonical) {
  const file = path.join(levelsRoot, `${item.id}.json`);
  const level = readJson(file);
  level.sources = item.sources;
  writeJson(file, level);
}

// ---------- 难度：历史 A~F 为真值，其余用历史样本做 KNN 估算 ----------
const legacy = { collections: [] };
const labelsByCanonical = new Map();
const difficultyForCollection = (id) =>
  ["a", "b", "c"].includes(id)
    ? "easy"
    : ["d", "e"].includes(id)
      ? "medium"
      : "hard";
for (const collection of legacy.collections) {
  const label = difficultyForCollection(collection.id);
  for (const canonicalId of collection.canonicalLevelIds) {
    if (Number(canonicalId) <= 5) continue; // 公共教学关不拿来训练难度。
    const list = labelsByCanonical.get(canonicalId) ?? [];
    list.push({
      label,
      collection: collection.id.toUpperCase(),
      collectionName: collection.name,
    });
    labelsByCanonical.set(canonicalId, list);
  }
}

for (const item of canonical) {
  if (!labelsByCanonical.has(item.id))
    labelsByCanonical.set(item.id, [
      {
        label:
          Number(item.id) % 3 === 0
            ? "hard"
            : Number(item.id) % 2 === 0
              ? "medium"
              : "easy",
        collection: "chapter",
      },
    ]);
}

const COMPLEX_TERRAIN = new Set([
  "snow",
  "water-animated",
  "tide-up",
  "tide-down",
  "tide-left",
  "tide-right",
  "ice",
  "shovel-pickup",
  "mower-parking",
  "speed-switch-pressed",
  "speed-switch-raised",
  "carousel-switch-raised",
  "carousel-switch-pressed",
  "tide-switch-raised",
  "tide-switch-pressed",
  "wind-switch-0-on",
  "wind-switch-0-off",
  "wind-switch-1-on",
  "wind-switch-1-off",
  "wind-switch-2-on",
  "wind-switch-2-off",
  "wind-switch-3-on",
  "wind-switch-3-off",
  "trap-active",
  "trap-inactive",
  "mirror-1",
  "mirror-2",
  "mirror-3",
  "mirror-4",
  "speed-up",
  "speed-down",
  "speed-left",
  "speed-right",
  "carousel-1",
  "carousel-2",
  "carousel-3",
  "carousel-4",
  "carousel-vertical",
  "carousel-horizontal",
  "color-yellow-switch-raised",
  "color-yellow-switch-pressed",
  "color-pink-switch-raised",
  "color-pink-switch-pressed",
  "color-yellow-block-raised",
  "color-yellow-block-lowered",
  "color-pink-block-raised",
  "color-pink-block-lowered",
  "high-grass",
  "high-grass-objective",
]);
const SIMPLE_OBJECT = new Set([
  "consumed-carrot",
  "carrot",
  "egg-nest-empty",
  "egg-nest-filled",
]);
function isComplexObject(type) {
  return !SIMPLE_OBJECT.has(type);
}

function featureVector(level) {
  const terrainFlat = level.terrain.flat();
  const objectTypes = level.objects.map((o) => o.type);
  const uniqueTerrain = new Set(terrainFlat);
  const uniqueObject = new Set(objectTypes);
  const area = level.width * level.height;
  const complexCells =
    terrainFlat.filter((type) => COMPLEX_TERRAIN.has(type)).length +
    objectTypes.filter(isComplexObject).length;
  const objectives =
    terrainFlat.filter((type) => type === "high-grass-objective").length +
    objectTypes.filter((type) => type === "carrot" || type === "egg-nest-empty")
      .length;
  return [
    Math.log2(Math.max(1, area)),
    level.objects.length / Math.sqrt(Math.max(1, area)),
    uniqueTerrain.size,
    uniqueObject.size,
    level.dynamicSlots,
    objectives,
    complexCells / Math.sqrt(Math.max(1, area)),
    [...uniqueTerrain].filter((type) => COMPLEX_TERRAIN.has(type)).length +
      [...uniqueObject].filter(isComplexObject).length,
  ];
}

const featureById = new Map();
for (const item of canonical)
  featureById.set(
    item.id,
    featureVector(readJson(path.join(levelsRoot, `${item.id}.json`))),
  );
const training = canonical
  .filter((item) => labelsByCanonical.has(item.id))
  .map((item) => ({
    id: item.id,
    vector: featureById.get(item.id),
    label: labelsByCanonical.get(item.id)[0].label,
  }));
const dims = training[0]?.vector.length ?? 0;
const mean = Array.from(
  { length: dims },
  (_, d) =>
    training.reduce((sum, row) => sum + row.vector[d], 0) / training.length,
);
const std = Array.from({ length: dims }, (_, d) => {
  const variance =
    training.reduce((sum, row) => sum + (row.vector[d] - mean[d]) ** 2, 0) /
    Math.max(1, training.length - 1);
  return Math.sqrt(variance) || 1;
});
function distance(a, b) {
  return Math.sqrt(
    a.reduce((sum, value, d) => sum + ((value - b[d]) / std[d]) ** 2, 0),
  );
}
function estimateDifficulty(vector) {
  const nearest = training
    .map((row) => ({ ...row, distance: distance(vector, row.vector) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 11);
  const score = { easy: 0, medium: 0, hard: 0 };
  for (const row of nearest)
    score[row.label] += 1 / Math.max(0.15, row.distance);
  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((sum, [, value]) => sum + value, 0) || 1;
  return {
    level: ranked[0][0],
    confidence: Number((ranked[0][1] / total).toFixed(3)),
  };
}
for (const item of canonical) {
  if (Number(item.id) <= 5) {
    item.difficulty = {
      level: "tutorial",
      source: "historical",
      label: "教学",
    };
    continue;
  }
  const historical = labelsByCanonical.get(item.id);
  if (historical?.length) {
    const labels = [...new Set(historical.map((x) => x.label))];
    item.difficulty = {
      level: labels[0],
      source: "historical",
      label:
        labels[0] === "easy"
          ? "简单"
          : labels[0] === "medium"
            ? "中等"
            : "困难",
      collections: historical.map((x) => x.collection),
    };
  } else {
    const estimated = estimateDifficulty(featureById.get(item.id));
    item.difficulty = {
      level: estimated.level,
      source: "estimated",
      label: `≈${estimated.level === "easy" ? "简单" : estimated.level === "medium" ? "中等" : "困难"}`,
      confidence: estimated.confidence,
    };
  }

  const file = path.join(levelsRoot, `${item.id}.json`);
  const level = readJson(file);
  level.difficulty = item.difficulty;
  writeJson(file, level);
}

/**
 * 官方运行时资产按语义来源生成，而不是把某个发行包视为整套“主资产”。
 * 完整 hash 证据与选择理由见 docs/reference/official-release-provenance.md。
 */
const artOut = path.join(generated, "art", "hd");
const midiOut = path.join(generated, "audio", "midi");
fs.rmSync(artOut, { recursive: true, force: true });
fs.rmSync(midiOut, { recursive: true, force: true });
fs.mkdirSync(artOut, { recursive: true });
fs.mkdirSync(midiOut, { recursive: true });
copyRuntimeAssetCategory(
  OFFICIAL_RUNTIME_ASSET_SOURCES.artwork,
  artOut,
);
copyRuntimeAssetCategory(
  OFFICIAL_RUNTIME_ASSET_SOURCES.music,
  midiOut,
);

const sourceIndex = readJson(path.join(decoded, "source-index.json"));
const chapters = [];
for (const release of sourceIndex.releases) {
  const publicRelease = publicReleaseId(release.id);
  for (const pack of release.packs) {
    // 00.dat 是所有发行包都重复携带的公共教学关，只在 Base 展示一次。
    if (pack.packFile === "00" && release.id !== "base") continue;
    const chapter = Number(pack.packFile);
    chapters.push({
      id: `${publicRelease}-${chapter}`,
      release: publicRelease,
      releaseSourceId: release.id,
      releaseLabel: release.label,
      chapter,
      title: pack.title,
      description: pack.description,
      levelPublicIds: canonical
        .filter(
          (item) =>
            item.releaseSourceId === release.id && item.chapter === chapter,
        )
        .map((item) => item.publicId),
    });
  }
}

const browserReleases = RELEASES.map((release) => ({
  id: publicReleaseId(release.id),
  sourceId: release.id,
  order: release.order,
  label: release.label,
  中文名: release.中文名,
  levelCount: release.id === "base" ? 53 : 48,
  chapters: chapters
    .filter((chapter) => chapter.releaseSourceId === release.id)
    .map((chapter) => chapter.id),
}));

const catalog = {
  schemaVersion: 3,
  idScheme: {
    public: "<release>-<chapter>-<level>",
    examples: ["base-1-1", "up1-2-7", "up9-4-12"],
    tutorial: "base-0-1...base-0-5",
    canonical: "001...485（仅内部去重与兼容）",
  },
  generatedFrom: sourceIndex.releases.map(
    ({ id, label, 中文名, levelCount }) => ({ id, label, 中文名, levelCount }),
  ),
  totalSourceLevels,
  uniqueLevels: canonical.length,
  duplicateSourceRecords: totalSourceLevels - canonical.length,
  expectedUniqueLevels: 485,
  art: {
    tileSize: SOURCE_TILE_SIZE,
    basePath: "art/hd",
    provenance: {
      defaultRelease: OFFICIAL_RUNTIME_ASSET_SOURCES.artwork.defaultRelease,
      overrides: OFFICIAL_RUNTIME_ASSET_SOURCES.artwork.overrides,
    },
  },
  music: {
    basePath: "audio/midi",
    format: "midi",
    provenance: {
      defaultRelease: OFFICIAL_RUNTIME_ASSET_SOURCES.music.defaultRelease,
      overrides: OFFICIAL_RUNTIME_ASSET_SOURCES.music.overrides,
    },
    files: fs
      .readdirSync(midiOut)
      .filter((n) => n.endsWith(".mid"))
      .sort(),
  },
  releases: browserReleases,
  chapters,
  legacyCollections: legacy.collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    levelCount: collection.levelCount,
    canonicalLevelIds: collection.canonicalLevelIds,
  })),
  difficulty: {
    historicalNonTutorialLevels: training.length,
    estimatedLevels: canonical.filter(
      (item) => item.difficulty?.source === "estimated",
    ).length,
    note: "A/B/C=简单，D/E=中等，F=困难；未被 A~F 覆盖的正式关卡使用这些历史样本做 KNN 估算并以 ≈ 标记。",
  },
  levels: canonical,
};

if (catalog.uniqueLevels !== 485)
  throw new Error(`主库应为 485 关，实际 ${catalog.uniqueLevels}`);
writeJson(path.join(generated, "catalog.json"), catalog);
console.log(
  `构建主库：${catalog.uniqueLevels} 个唯一关卡 / ${catalog.totalSourceLevels} 条 source 记录；历史难度 ${catalog.difficulty.historicalNonTutorialLevels}，估算 ${catalog.difficulty.estimatedLevels}。`,
);

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
    if (!fs.existsSync(source)) {
      throw new Error(`运行时资产来源不存在：${release}/${name}`);
    }
    copy(source, path.join(outputDir, name));
  }
}
