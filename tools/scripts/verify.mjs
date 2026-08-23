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
if (catalog.difficulty.historicalNonTutorialLevels !== 288) throw new Error(`Expected 288 historical difficulty labels`);
if (catalog.difficulty.estimatedLevels !== 192) throw new Error(`Expected 192 estimated difficulty labels`);
if (catalog.levels[0]?.publicId !== 'base-0-1') throw new Error('First public ID must be base-0-1');
if (catalog.levels[5]?.publicId !== 'base-1-1') throw new Error('Base chapter route mismatch');
if (catalog.levels.at(-1)?.publicId !== 'up9-4-12') throw new Error('Last public ID must be up9-4-12');
for (const level of catalog.levels) {
  const file = path.join(root, 'assets/generated', level.path);
  if (!fs.existsSync(file)) throw new Error(`Missing canonical level ${file}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (data.terrain.length !== data.height) throw new Error(`Bad terrain height in ${level.id}`);
  if (data.terrain.some((row) => row.length !== data.width)) throw new Error(`Bad terrain width in ${level.id}`);
}
for (const file of [
  'dist/web/index.html',
  'dist/web/app.js',
  'dist/web/engine/index.js',
  'dist/web/editor/index.js',
  'dist/web/editor.css',
  'dist/web/assets/catalog.json',
  'dist/web/assets/art/hd/ts.png',
  'dist/web/assets/art/hd/ta.png',
  'dist/web/assets/art/hd/b0.png',
  'dist/web/assets/art/hd/b1.png',
  'dist/web/assets/art/hd/b2.png',
  'dist/web/assets/art/hd/b3.png',
  'dist/web/edit/index.html',
  'dist/web/edit/base-1-1/index.html',
  'dist/web/edit/up9-4-12/index.html',
  'dist/web/play/index.html',
  'dist/web/play/base-0-1/index.html',
  'dist/web/play/base-1-1/index.html',
  'dist/web/play/up9-4-12/index.html',
  'dist/web/play/001/index.html',
  'dist/web/play/485/index.html',
  'dist/web/TinySynthAudio.js',
  'dist/web/levels/index.html',
  'dist/web/404.html',
  'dist/engine-playground/index.html'
]) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing build artifact: ${file}`);
}
console.log('verify: OK — 10 个发行包 / 41 章节 / 485 关；Engine + Editor + Web、JSON/URL 分享与全部测试通过。');
