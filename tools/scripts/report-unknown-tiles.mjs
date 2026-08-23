import fs from 'node:fs';
import path from 'node:path';
import { root, run } from './util.mjs';
import { encodeDatTerrain, encodeDatObject } from '../src/dat-codec.mjs';

run(process.execPath, ['tools/scripts/build.mjs']);

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated/catalog.json'), 'utf8'));
const byType = new Map();

function add(kind, type, level, x, y) {
  if (!/^(?:walkable|background|object)-variant-/.test(type)) return;
  const key = `${kind}:${type}`;
  const item = byType.get(key) ?? { kind, type, dat: kind === 'terrain' ? encodeDatTerrain(type) : encodeDatObject(type), count: 0, levels: new Map(), samples: [] };
  item.count += 1;
  item.levels.set(level.publicId, (item.levels.get(level.publicId) ?? 0) + 1);
  if (item.samples.length < 8) item.samples.push({ level: level.publicId, x, y });
  byType.set(key, item);
}

for (const meta of catalog.levels) {
  const level = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated', meta.path), 'utf8'));
  for (let y = 0; y < level.height; y += 1) for (let x = 0; x < level.width; x += 1) add('terrain', level.terrain[y][x], meta, x, y);
  for (const object of level.objects) add('object', object.type, meta, object.x, object.y);
}

const result = [...byType.values()].sort((a, b) => a.dat - b.dat).map((item) => ({
  ...item,
  datHex: `0x${item.dat.toString(16).toUpperCase().padStart(2, '0')}`,
  levelCount: item.levels.size,
  levels: [...item.levels.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([level, count]) => ({ level, count }))
}));

fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp/unknown-tiles.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ unknownTypes: result.length, terrainTypes: result.filter(x => x.kind === 'terrain').length, objectTypes: result.filter(x => x.kind === 'object').length }, null, 2));
