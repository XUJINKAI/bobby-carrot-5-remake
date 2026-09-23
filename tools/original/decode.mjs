import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDatPackage } from "./level-format.mjs";
import {
  DAT_FILES,
  RELEASES,
  SOURCE_TILE_SIZE,
} from "./source-definitions.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function decodeOriginal({
  repositoryRoot = root,
  extractedRoot = path.join(repositoryRoot, "tmp/assets/bc5/extracted"),
  outputRoot = path.join(repositoryRoot, "tmp/assets/bc5/decoded"),
} = {}) {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  const sourceIndex = {
    schemaVersion: 1,
    sourceTileSize: SOURCE_TILE_SIZE,
    releases: [],
    totalSourceLevels: 0,
  };

  for (const release of RELEASES) {
    const extracted = path.join(extractedRoot, release.id);
    if (!fs.existsSync(extracted)) {
      throw new Error(`请先执行 original extract：缺少 ${extracted}`);
    }
    const releaseOut = path.join(outputRoot, release.id);
    const packs = [];
    let count = 0;

    for (const packFile of DAT_FILES) {
      const datPath = path.join(extracted, `${packFile}.dat`);
      const parsed = parseDatPackage(fs.readFileSync(datPath), {
        edition: release.id,
        release: release.id,
        releaseLabel: release.label,
        packFile,
      });
      const english = parsed.metadata?.languages?.EN ?? null;
      const packInfo = {
        packFile,
        packageSha256: parsed.packageSha256,
        metadataLength: parsed.metadataLength,
        packType: parsed.metadata?.packType ?? null,
        title:
          english?.title ??
          (packFile === "00"
            ? "Special Scenes"
            : `${release.label} / ${packFile}`),
        description: english?.description ?? "",
        metadata: parsed.metadata,
        levelCount: parsed.levels.length,
      };
      packs.push(packInfo);

      for (const level of parsed.levels) {
        const name = `${packFile}-${String(level.source.levelIndex).padStart(2, "0")}.json`;
        writeJson(path.join(releaseOut, "levels", name), {
          ...level,
          source: {
            ...level.source,
            releaseOrder: release.order,
            packTitle: packInfo.title,
            packDescription: packInfo.description,
          },
        });
        count += 1;
      }
    }

    writeJson(path.join(releaseOut, "packs.json"), {
      schemaVersion: 1,
      release,
      packs,
      levelCount: count,
    });
    sourceIndex.releases.push({
      ...release,
      tileSize: SOURCE_TILE_SIZE,
      levelCount: count,
      packs,
    });
    sourceIndex.totalSourceLevels += count;
    console.log(`解码 ${release.id}: ${count} 个 source level`);
  }

  writeJson(path.join(outputRoot, "source-index.json"), sourceIndex);
  console.log(`共解码 ${sourceIndex.totalSourceLevels} 条 source level 记录。`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  decodeOriginal();
}
