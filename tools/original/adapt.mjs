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
      schemaVersion: 3,
      width: level.width,
      height: level.height,
      terrain: level.terrain,
      objects: adaptObjects(level.objects, id, sourceRef),
      rules: {
        win: {
          type: "all",
          conditions: [
            { type: "collect-all", trait: "level-objective" },
            {
              type: "fill-all",
              terrainTrait: "push-goal",
              objectTrait: "pushable",
            },
            { type: "reach-terrain", trait: "exit" },
          ],
        },
      },
    });
  }
}

function isOriginalBonus(source) {
  return source.packFile !== "00" && [11, 12].includes(Number(source.levelIndex));
}

function adaptObjects(objects, canonicalId, source) {
  return objects.map((object) => {
    const properties = { ...(object.properties ?? {}) };
    if (isOriginalBonus(source) && object.type === "lock")
      properties.timedChallengeMs = properties.timedChallengeMs ?? "60000";
    if (object.type === "sandman")
      properties.dialogId =
        properties.dialogId ??
        `original.map-${canonicalId}.sandman-${object.x}-${object.y}`;
    return {
      ...object,
      ...(Object.keys(properties).length > 0 ? { properties } : {}),
    };
  });
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
  levels: canonical,
};

if (catalog.uniqueLevels !== 485)
  throw new Error(`主库应为 485 关，实际 ${catalog.uniqueLevels}`);
writeJson(path.join(generated, "catalog.json"), catalog);
console.log(
  `构建主库：${catalog.uniqueLevels} 个唯一关卡 / ${catalog.totalSourceLevels} 条 source 记录。`,
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
