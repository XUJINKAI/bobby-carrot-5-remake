import fs from 'node:fs';
import path from 'node:path';
import { root, run } from './util.mjs';
import { encodeDatTerrain, encodeDatObject } from '../src/dat-codec.mjs';

const showAll = process.argv.includes('--all');
const previewLimit = 2;

run(process.execPath, ['tools/scripts/build.mjs']);

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated/catalog.json'), 'utf8'));
const byType = new Map();

function add(kind, type, level, x, y) {
  if (!/^(?:walkable|background|object)-variant-/.test(type)) return;
  const key = `${kind}:${type}`;
  const item = byType.get(key) ?? {
    kind,
    type,
    dat: kind === 'terrain' ? encodeDatTerrain(type) : encodeDatObject(type),
    count: 0,
    levels: new Map(),
    samples: []
  };
  item.count += 1;
  item.levels.set(level.publicId, (item.levels.get(level.publicId) ?? 0) + 1);
  item.samples.push({ level: level.publicId, x, y });
  byType.set(key, item);
}

for (const meta of catalog.levels) {
  const level = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated', meta.path), 'utf8'));
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) add('terrain', level.terrain[y][x], meta, x, y);
  }
  for (const object of level.objects) add('object', object.type, meta, object.x, object.y);
}

const result = [...byType.values()]
  .sort((a, b) => a.dat - b.dat)
  .map((item) => {
    const levels = [...item.levels.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([level, count]) => ({ level, count }));
    return {
      kind: item.kind,
      type: item.type,
      dat: item.dat,
      datHex: `0x${item.dat.toString(16).toUpperCase().padStart(2, '0')}`,
      count: item.count,
      levelCount: item.levels.size,
      levels: showAll ? levels : levels.slice(0, previewLimit),
      samples: showAll ? item.samples : item.samples.slice(0, previewLimit),
      ...(!showAll && (levels.length > previewLimit || item.samples.length > previewLimit)
        ? { truncated: true }
        : {})
    };
  });

fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp/unknown-tiles.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  unknownTypes: result.length,
  terrainTypes: result.filter((item) => item.kind === 'terrain').length,
  objectTypes: result.filter((item) => item.kind === 'object').length,
  output: 'tmp/unknown-tiles.json',
  detail: showAll ? 'all levels and samples' : `first ${previewLimit} levels and samples per type (use --all for everything)`
}, null, 2));
