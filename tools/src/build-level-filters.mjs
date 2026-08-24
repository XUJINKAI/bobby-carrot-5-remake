import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const generated = path.join(root, 'assets/generated');
const catalogPath = path.join(generated, 'catalog.json');

if (!fs.existsSync(catalogPath)) throw new Error('build-level-filters 需要先生成 assets/generated/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const WATER = new Set(['water', 'water-animated', 'water-variant-1', 'water-variant-2', 'water-variant-3', 'tide-up', 'tide-down', 'tide-left', 'tide-right']);
const GROUND = new Set(['ground-a', 'ground-b', 'ground-c', 'ground-d', 'shovel-cleared-ground']);

const TERRAIN_MECHANICS = [
  ['tide', (type) => type.startsWith('tide-')],
  ['speed', (type) => type.startsWith('speed-')],
  ['carousel', (type) => type.startsWith('carousel-')],
  ['wind', (type) => type.startsWith('wind-switch-')],
  ['mirror', (type) => type.startsWith('mirror-')],
  ['trap', (type) => type.startsWith('trap-')],
  ['color-switch', (type) => type.startsWith('color-yellow-') || type.startsWith('color-pink-')],
  ['mower', (type) => type === 'mower-parking' || type === 'high-grass' || type === 'high-grass-objective']
];

const OBJECT_MECHANICS = [
  ['wind', (type) => type.startsWith('windmill-') || type.startsWith('cloud-')],
  ['mower', (type) => type === 'mower' || type === 'gas'],
  ['beanstalk', (type) => type === 'bean' || type === 'bean-field' || type.startsWith('beanstalk-')],
  ['dragon', (type) => type === 'dragon-head'],
  ['beaver', (type) => type === 'beaver-base' || type === 'lock'],
  ['dream', (type) => type === 'sandman' || type === 'dream-machine'],
  ['plank', (type) => type === 'plank'],
  ['whirlwind', (type) => type === 'whirlwind' || type === 'kite' || type === 'landing'],
  ['ice-block', (type) => type === 'ice-block']
];

function levelFeatures(level) {
  const terrain = level.terrain.flat();
  const terrainSet = new Set(terrain);
  const objectTypes = level.objects.map((object) => object.type);
  const objectSet = new Set(objectTypes);

  const explicitCarrots = objectTypes.filter((type) => type === 'carrot').length;
  const hiddenObjectives = terrain.filter((type) => type === 'high-grass-objective').length;
  const carrotCount = explicitCarrots > 0 ? explicitCarrots + hiddenObjectives : 0;

  const specialItems = [];
  if (terrainSet.has('shovel-pickup')) specialItems.push('shovel');
  if (objectSet.has('mower') || terrainSet.has('mower-parking')) specialItems.push('mower');
  if (objectSet.has('gas')) specialItems.push('gas');
  if (objectSet.has('bean')) specialItems.push('bean');
  if (objectSet.has('kite')) specialItems.push('kite');
  if (objectSet.has('golden-carrot')) specialItems.push('golden-carrot');
  if (objectSet.has('bonus-coin')) specialItems.push('bonus-coin');

  const scenes = [];
  if (terrain.some((type) => GROUND.has(type) || type.startsWith('walkable-variant-'))) scenes.push('grassland');
  if (terrain.some((type) => WATER.has(type))) scenes.push('water');
  if (terrainSet.has('snow')) scenes.push('snow');
  if (terrainSet.has('ice') || objectSet.has('ice-block')) scenes.push('ice');
  if (terrainSet.has('high-grass') || terrainSet.has('high-grass-objective')) scenes.push('high-grass');
  if (terrain.some((type) => type.startsWith('shop-'))) scenes.push('shop');

  const mechanics = new Set();
  for (const [id, matches] of TERRAIN_MECHANICS) if (terrain.some(matches)) mechanics.add(id);
  for (const [id, matches] of OBJECT_MECHANICS) if (objectTypes.some(matches)) mechanics.add(id);

  return { carrotCount, specialItems, scenes, mechanics: [...mechanics] };
}

const levels = {};
for (const item of catalog.levels ?? []) {
  const file = path.join(generated, item.path);
  const level = JSON.parse(fs.readFileSync(file, 'utf8'));
  levels[item.publicId] = levelFeatures(level);
}

const output = {
  schemaVersion: 1,
  generatedFromCatalogSchema: catalog.schemaVersion,
  levelCount: Object.keys(levels).length,
  levels
};
fs.writeFileSync(path.join(generated, 'level-filters.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`构建关卡筛选索引：${output.levelCount} 关`);
