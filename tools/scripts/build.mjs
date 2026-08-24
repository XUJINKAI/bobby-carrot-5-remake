import fs from 'node:fs';
import path from 'node:path';
import { root, run, tscCommand, copyTree, copyFile } from './util.mjs';

const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.rmSync(path.join(root, 'engine/dist'), { recursive: true, force: true });
fs.rmSync(path.join(root, 'editor/dist'), { recursive: true, force: true });
fs.rmSync(path.join(root, 'web/dist-src'), { recursive: true, force: true });

run(process.execPath, ['tools/src/extract-jars.mjs']);
run(process.execPath, ['tools/src/decode-levels.mjs']);
run(process.execPath, ['tools/src/build-assets.mjs']);
run(process.execPath, ['tools/src/build-level-filters.mjs']);

const tsc = tscCommand();
run(tsc, ['-p', 'engine/tsconfig.json']);
run(tsc, ['-p', 'editor/tsconfig.json']);
run(tsc, ['-p', 'web/tsconfig.json']);

fs.mkdirSync(dist, { recursive: true });
copyFile(path.join(root, 'web/index.html'), path.join(dist, 'index.html'));
copyFile(path.join(root, 'web/style.css'), path.join(dist, 'style.css'));
copyFile(path.join(root, 'web/level-filters.css'), path.join(dist, 'level-filters.css'));
copyFile(path.join(root, 'editor/style.css'), path.join(dist, 'editor.css'));
copyTree(path.join(root, 'web/dist-src'), dist);
copyFile(path.join(root, 'web/dist-src/main.js'), path.join(dist, 'app.js'));
if (fs.existsSync(path.join(root, 'web/dist-src/main.js.map'))) copyFile(path.join(root, 'web/dist-src/main.js.map'), path.join(dist, 'app.js.map'));
copyTree(path.join(root, 'engine/dist'), path.join(dist, 'engine'));
copyTree(path.join(root, 'editor/dist'), path.join(dist, 'editor'));
copyTree(path.join(root, 'assets/generated'), path.join(dist, 'assets'));

const tinySynthCandidates = [
  path.join(root, 'node_modules/webaudio-tinysynth/webaudio-tinysynth.min.js'),
  path.join(root, 'node_modules/webaudio-tinysynth/webaudio-tinysynth.js')
];
const tinySynthSource = tinySynthCandidates.find((candidate) => fs.existsSync(candidate));
if (tinySynthSource) {
  copyFile(tinySynthSource, path.join(dist, 'vendor/webaudio-tinysynth.min.js'));
} else {
  console.warn('提示：当前环境未安装 webaudio-tinysynth；发布包将使用固定版本 CDN fallback。正常 npm install 后会自动本地化。');
}

console.log('Build complete: dist');
