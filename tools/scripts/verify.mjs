import fs from 'node:fs';
import path from 'node:path';
import { root, run } from './util.mjs';

run(process.execPath, ['tools/scripts/build.mjs']);
run(process.execPath, ['--test', 'engine/tests/*.test.mjs', 'editor/tests/*.test.mjs'], { shell: true });

const catalogPath = path.join(root, 'assets/generated/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (catalog.totalSourceLevels !== 530) throw new Error(`Expected 530 source levels, got ${catalog.totalSourceLevels}`);
if (catalog.uniqueLevels !== 485) throw new Error(`Expected 485 unique levels, got ${catalog.uniqueLevels}`);
if (catalog.schemaVersion !== 3) throw new Error(`Expected catalog schema 3, got ${catalog.schemaVersion}`);
if (catalog.releases.length !== 10) throw new Error(`Expected 10 releases, got ${catalog.releases.length}`);
if (catalog.chapters.length !== 41) throw new Error(`Expected Base tutorial + 40 formal chapters = 41, got ${catalog.chapters.length}`);
if (catalog.difficulty.historicalNonTutorialLevels !== 288) throw new Error('Expected 288 historical difficulty labels');
if (catalog.difficulty.estimatedLevels !== 192) throw new Error('Expected 192 estimated difficulty labels');
if (catalog.levels[0]?.publicId !== 'base-0-1') throw new Error('First public ID must be base-0-1');
if (catalog.levels[5]?.publicId !== 'base-1-1') throw new Error('Base chapter route mismatch');
if (catalog.levels.at(-1)?.publicId !== 'up9-4-12') throw new Error('Last public ID must be up9-4-12');

for (const level of catalog.levels) {
  const file = path.join(root, 'assets/generated', level.path);
  if (!fs.existsSync(file)) throw new Error(`Missing canonical level ${file}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (data.schemaVersion !== 2) throw new Error(`Level ${level.id} must use semantic schema v2`);
  if (data.terrainEncoding !== 'semantic-row-major') throw new Error(`Level ${level.id} has non-semantic terrain encoding`);
  if (data.terrain.length !== data.height) throw new Error(`Bad terrain height in ${level.id}`);
  if (data.terrain.some((row) => row.length !== data.width)) throw new Error(`Bad terrain width in ${level.id}`);
  if (data.terrain.some((row) => row.some((type) => typeof type !== 'string'))) throw new Error(`Raw terrain value leaked into ${level.id}`);
  if (data.objects.some((object) => typeof object.type !== 'string')) throw new Error(`Raw object value leaked into ${level.id}`);
  if (data.objects.some((object) => 'id' in object || 'signedId' in object || 'hexId' in object)) throw new Error(`Legacy DAT object fields leaked into ${level.id}`);
}

const filterIndexPath = path.join(root, 'assets/generated/level-filters.json');
if (!fs.existsSync(filterIndexPath)) throw new Error('Missing generated level filter index');
const filterIndex = JSON.parse(fs.readFileSync(filterIndexPath, 'utf8'));
if (filterIndex.schemaVersion !== 1) throw new Error(`Expected level filter schema 1, got ${filterIndex.schemaVersion}`);
if (filterIndex.levelCount !== 485) throw new Error(`Expected 485 level filter rows, got ${filterIndex.levelCount}`);
for (const level of catalog.levels) {
  const features = filterIndex.levels?.[level.publicId];
  if (!features) throw new Error(`Missing filter features for ${level.publicId}`);
  if (!Number.isInteger(features.carrotCount) || features.carrotCount < 0) throw new Error(`Bad carrot count for ${level.publicId}`);
  for (const key of ['specialItems', 'scenes', 'mechanics']) {
    if (!Array.isArray(features[key]) || features[key].some((value) => typeof value !== 'string')) throw new Error(`Bad ${key} filter data for ${level.publicId}`);
  }
}

const legacyFieldPatterns = [/\.signedId\b/, /\.hexId\b/, /\.terrainHexId\b/, /\.objectHexId\b/, /\bsignedId\s*:/, /\bhexId\s*:/, /\bterrainHexId\s*:/, /\bobjectHexId\s*:/];
for (const sourcePath of ['engine/src', 'editor/src', 'web/src']) {
  walkSource(path.join(root, sourcePath), (file, text) => {
    if (legacyFieldPatterns.some((pattern) => pattern.test(text))) throw new Error(`Legacy DAT field usage leaked into ${path.relative(root, file)}`);
  });
}

for (const file of [
  'dist/index.html',
  'dist/app.js',
  'dist/level-filters.js',
  'dist/level-filters.css',
  'dist/engine/index.js',
  'dist/editor/index.js',
  'dist/editor.css',
  'dist/assets/catalog.json',
  'dist/assets/level-filters.json',
  'dist/assets/art/hd/ts.png',
  'dist/assets/art/hd/ta.png',
  'dist/assets/art/hd/b0.png',
  'dist/assets/art/hd/b1.png',
  'dist/assets/art/hd/b2.png',
  'dist/assets/art/hd/b3.png',
  'dist/TinySynthAudio.js'
]) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing build artifact: ${file}`);
}

for (const removed of ['dist/web', 'dist/engine-playground', 'dist/play', 'dist/edit', 'dist/levels', 'dist/settings', 'dist/404.html']) {
  if (fs.existsSync(path.join(root, removed))) throw new Error(`Obsolete static build artifact still exists: ${removed}`);
}

verifyWebModuleEntry(path.join(root, 'dist'));
if (process.env.CI) run(process.execPath, ['tools/scripts/browser-smoke.mjs']);

console.log('verify: OK — 10 个发行包 / 41 章节 / 485 关；单一 dist SPA、semantic LevelData、Engine + Editor + Web 与全部测试通过。');

function verifyWebModuleEntry(webRoot) {
  const indexPath = path.join(webRoot, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const baseHref = html.match(/<base\s+href=["']([^"']+)["']/i)?.[1] ?? '/';
  const importMapText = html.match(/<script\s+type=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!importMapText) throw new Error('dist/index.html is missing an import map');
  let importMap;
  try { importMap = JSON.parse(importMapText); }
  catch (error) { throw new Error(`Invalid import map JSON: ${error instanceof Error ? error.message : String(error)}`); }
  const imports = importMap?.imports;
  if (!imports || typeof imports !== 'object') throw new Error('Import map must define imports');
  for (const [specifier, target] of Object.entries(imports)) {
    if (typeof target !== 'string') throw new Error(`Import map target for ${specifier} must be a string`);
    if (!isUrlLikeImportTarget(target)) throw new Error(`Import map target for ${specifier} is not URL-like: ${JSON.stringify(target)}`);
    verifyLocalWebTarget(webRoot, baseHref, target, `import map ${specifier}`);
  }
  for (const match of html.matchAll(/<script\s+type=["']module["'][^>]*\ssrc=["']([^"']+)["']/gi)) verifyLocalWebTarget(webRoot, baseHref, match[1], 'module script');
}

function isUrlLikeImportTarget(target) {
  return target.startsWith('/') || target.startsWith('./') || target.startsWith('../') || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(target);
}

function verifyLocalWebTarget(webRoot, baseHref, target, label) {
  const origin = 'https://verify.invalid';
  const baseUrl = new URL(baseHref, `${origin}/index.html`);
  const resolved = new URL(target, baseUrl);
  if (resolved.origin !== origin) return;
  const relative = decodeURIComponent(resolved.pathname).replace(/^\/+/, '');
  const file = path.resolve(webRoot, relative);
  const normalizedRoot = `${path.resolve(webRoot)}${path.sep}`;
  if (file !== path.resolve(webRoot) && !file.startsWith(normalizedRoot)) throw new Error(`${label} escapes dist: ${target}`);
  if (!fs.existsSync(file)) throw new Error(`${label} resolves to missing build artifact: ${target} -> ${path.relative(root, file)}`);
}

function walkSource(directory, visitor) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walkSource(file, visitor);
    else if (/\.(?:ts|js|mjs)$/.test(entry.name)) visitor(file, fs.readFileSync(file, 'utf8'));
  }
}
