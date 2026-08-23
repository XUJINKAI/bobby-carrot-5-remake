import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDatPackage } from './level-format.mjs';
import { DAT_FILES, RELEASES, SOURCE_TILE_SIZE } from './source-definitions.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const generated = path.join(root, 'assets/generated');
const sourceRoot = path.join(generated, 'sources');

const IMPLICIT_OBJECT_PARTS = new Map([
  ['dragon-head', [
    { dx: 1, dy: 0, type: 'dragon-body' },
    { dx: 2, dy: 0, type: 'dragon-tail' }
  ]],
  ['sandman', [{ dx: 0, dy: 1, type: 'sandman-body' }]],
  ['dream-machine', [{ dx: 0, dy: 1, type: 'dream-machine-body' }]],
  ['beaver-base', [{ dx: 0, dy: 1, type: 'beaver-body' }]]
]);

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * 原版 DAT 只保存 Dragon/Sandman/Dream Machine/Beaver 的主 Object；原程序在载入时隐式补出其余格。
 * bc5r 在原版导入边界就把这些隐式格物化成普通语义 Object。之后 Engine、Editor、分享地图都只处理
 * LevelData 中真实存在的独立 Tile，不再维护 composite/anchor 关系。
 */
export function materializeOriginalObjectParts(level) {
  const objects = level.objects.map((object) => ({ ...object }));
  const occupied = new Set(objects.map((object) => `${object.x},${object.y}`));
  for (const anchor of level.objects) {
    const parts = IMPLICIT_OBJECT_PARTS.get(anchor.type);
    if (!parts) continue;
    for (const part of parts) {
      const x = anchor.x + part.dx;
      const y = anchor.y + part.dy;
      if (x < 0 || y < 0 || x >= level.width || y >= level.height) continue;
      const key = `${x},${y}`;
      if (occupied.has(key)) continue;
      occupied.add(key);
      objects.push({ type: part.type, x, y });
    }
  }
  return { ...level, objects };
}

fs.rmSync(sourceRoot, { recursive: true, force: true });
const sourceIndex = { schemaVersion: 2, sourceTileSize: SOURCE_TILE_SIZE, releases: [], totalSourceLevels: 0 };

for (const release of RELEASES) {
  const extracted = path.join(root, 'assets/extracted', release.id);
  if (!fs.existsSync(extracted)) throw new Error(`请先执行 npm run assets:extract：缺少 ${extracted}`);
  const releaseOut = path.join(sourceRoot, release.id);
  const packs = [];
  let count = 0;

  for (const packFile of DAT_FILES) {
    const datPath = path.join(extracted, `${packFile}.dat`);
    const parsed = parseDatPackage(fs.readFileSync(datPath), {
      edition: release.id,
      release: release.id,
      releaseLabel: release.label,
      packFile
    });
    const english = parsed.metadata?.languages?.EN ?? null;
    const packInfo = {
      packFile,
      packageSha256: parsed.packageSha256,
      metadataLength: parsed.metadataLength,
      packType: parsed.metadata?.packType ?? null,
      title: english?.title ?? (packFile === '00' ? 'Tutorial' : `${release.label} / ${packFile}`),
      description: english?.description ?? '',
      metadata: parsed.metadata,
      levelCount: parsed.levels.length
    };
    packs.push(packInfo);

    for (const rawLevel of parsed.levels) {
      const level = materializeOriginalObjectParts(rawLevel);
      const name = `${packFile}-${String(level.source.levelIndex).padStart(2, '0')}.json`;
      writeJson(path.join(releaseOut, 'levels', name), {
        ...level,
        source: {
          ...level.source,
          releaseOrder: release.order,
          packTitle: packInfo.title,
          packDescription: packInfo.description
        }
      });
      count += 1;
    }
  }

  writeJson(path.join(releaseOut, 'packs.json'), { schemaVersion: 2, release, packs, levelCount: count });
  sourceIndex.releases.push({ ...release, tileSize: SOURCE_TILE_SIZE, levelCount: count, packs });
  sourceIndex.totalSourceLevels += count;
  console.log(`解码 ${release.id}: ${count} 个 source level`);
}

writeJson(path.join(generated, 'source-index.json'), sourceIndex);
console.log(`共解码 ${sourceIndex.totalSourceLevels} 条 source level 记录。`);
