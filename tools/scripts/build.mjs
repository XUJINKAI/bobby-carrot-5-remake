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

const webOut = path.join(dist, 'web');
fs.mkdirSync(webOut, { recursive: true });
copyFile(path.join(root, 'web/index.html'), path.join(webOut, 'index.html'));
copyFile(path.join(root, 'web/style.css'), path.join(webOut, 'style.css'));
copyFile(path.join(root, 'web/level-filters.css'), path.join(webOut, 'level-filters.css'));
copyFile(path.join(root, 'editor/style.css'), path.join(webOut, 'editor.css'));
// Web 源码可能拆成多个 ESM 模块；先整体复制编译目录，再把 main.js 复制为 index.html 使用的 app.js。
copyTree(path.join(root, 'web/dist-src'), webOut);
copyFile(path.join(root, 'web/dist-src/main.js'), path.join(webOut, 'app.js'));
if (fs.existsSync(path.join(root, 'web/dist-src/main.js.map'))) copyFile(path.join(root, 'web/dist-src/main.js.map'), path.join(webOut, 'app.js.map'));
copyTree(path.join(root, 'engine/dist'), path.join(webOut, 'engine'));
copyTree(path.join(root, 'editor/dist'), path.join(webOut, 'editor'));
copyTree(path.join(root, 'assets/generated'), path.join(webOut, 'assets'));
// npm install 后优先把 WebAudio TinySynth 固定版本打入发布目录，运行时不依赖 CDN。
const tinySynthCandidates = [
  path.join(root, 'node_modules/webaudio-tinysynth/webaudio-tinysynth.min.js'),
  path.join(root, 'node_modules/webaudio-tinysynth/webaudio-tinysynth.js')
];
const tinySynthSource = tinySynthCandidates.find((candidate) => fs.existsSync(candidate));
if (tinySynthSource) {
  copyFile(tinySynthSource, path.join(webOut, 'vendor/webaudio-tinysynth.min.js'));
} else {
  console.warn('提示：当前环境未安装 webaudio-tinysynth；发布包将使用固定版本 CDN fallback。正常 npm install 后会自动本地化。');
}

// 生成静态路由入口，使不支持 SPA fallback 的普通静态服务器也能直接刷新 /levels、/settings、/play/NNN。
// 页面内部资源均使用站点根路径，因此这些 index.html 可以直接复用同一份入口文件。
const webIndex = fs.readFileSync(path.join(webOut, 'index.html'));
for (const route of ['levels', 'settings', 'edit', 'play']) {
  const routeDir = path.join(webOut, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), webIndex);
}
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/generated/catalog.json'), 'utf8'));
for (const level of catalog.levels ?? []) {
  // 玩家可见原著式 ID，例如 /play/base-1-1、/play/up9-4-12。
  const publicRoute = path.join(webOut, 'play', String(level.publicId));
  fs.mkdirSync(publicRoute, { recursive: true });
  fs.writeFileSync(path.join(publicRoute, 'index.html'), webIndex);
  // 旧 canonical URL 继续保留，方便 R2 书签和旧存档迁移。
  const legacyRoute = path.join(webOut, 'play', String(level.id));
  fs.mkdirSync(legacyRoute, { recursive: true });
  fs.writeFileSync(path.join(legacyRoute, 'index.html'), webIndex);
  // 官方地图可一键复制进 Editor；原始数据本身永远不被修改。
  const editRoute = path.join(webOut, 'edit', String(level.publicId));
  fs.mkdirSync(editRoute, { recursive: true });
  fs.writeFileSync(path.join(editRoute, 'index.html'), webIndex);
}
// GitHub Pages 等平台可使用 404.html 回落到同一前端入口。
fs.writeFileSync(path.join(webOut, '404.html'), webIndex);

const playgroundOut = path.join(dist, 'engine-playground');
copyTree(path.join(root, 'engine/playground'), playgroundOut);
copyTree(path.join(root, 'engine/dist'), path.join(playgroundOut, 'engine'));
copyTree(path.join(root, 'assets/generated'), path.join(playgroundOut, 'assets'));

console.log('Build complete:');
console.log('  dist/web');
console.log('  dist/engine-playground');
console.log('  Editor integrated at dist/web/edit');
