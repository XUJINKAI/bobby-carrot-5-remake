import fs from 'node:fs';
import path from 'node:path';
import { copyFile, copyTree, root, run, tscCommand } from './util.mjs';

const dist = path.join(root, 'dist');
const generatedTargets = [
  dist,
  'model/dist',
  'dat/dist',
  'adventure/dist',
  'engine/dist',
  'editor/dist',
  'web/dist-src',
].map((value) => (path.isAbsolute(value) ? value : path.join(root, value)));

for (const target of generatedTargets) {
  fs.rmSync(target, { recursive: true, force: true });
}

const tsc = tscCommand();

// 先构建生成资产所依赖的纯数据层，再生成 Catalog 和美术资产。
run(tsc, ['-b', 'model', 'dat', 'adventure', '--force']);
run(process.execPath, ['tools/src/extract-jars.mjs']);
run(process.execPath, ['tools/src/decode-levels.mjs']);
run(process.execPath, ['tools/src/build-assets.mjs']);
run(process.execPath, ['tools/src/build-adventure-catalog.mjs']);
run(process.execPath, ['tools/src/build-level-filters.mjs']);

// Engine、Editor 和 Web 会消费上一步生成的语义资产。
run(tsc, ['-b', 'engine', 'editor', 'web', '--force']);

fs.mkdirSync(dist, { recursive: true });

for (const file of ['index.html', 'style.css', 'level-filters.css', 'adventure.css']) {
  copyFile(path.join(root, 'web', file), path.join(dist, file));
}
copyFile(path.join(root, 'editor/style.css'), path.join(dist, 'editor.css'));

copyTree(path.join(root, 'web/dist-src'), dist);
copyTree(path.join(root, 'model/dist'), path.join(dist, 'model'));
copyTree(path.join(root, 'dat/dist'), path.join(dist, 'dat'));
copyTree(path.join(root, 'adventure/dist'), path.join(dist, 'adventure'));
copyTree(path.join(root, 'engine/dist'), path.join(dist, 'engine'));
copyTree(path.join(root, 'editor/dist'), path.join(dist, 'editor'));
copyTree(path.join(root, 'assets/generated'), path.join(dist, 'assets'));

const tinySynthCandidates = [
  path.join(root, 'node_modules/webaudio-tinysynth/webaudio-tinysynth.min.js'),
  path.join(root, 'node_modules/webaudio-tinysynth/webaudio-tinysynth.js'),
];
const tinySynthSource = tinySynthCandidates.find((candidate) => fs.existsSync(candidate));

if (tinySynthSource) {
  copyFile(tinySynthSource, path.join(dist, 'vendor/webaudio-tinysynth.min.js'));
} else {
  console.warn('提示：当前环境未安装 webaudio-tinysynth；发布包将使用固定版本 CDN fallback。');
}

console.log('Build complete: dist');
