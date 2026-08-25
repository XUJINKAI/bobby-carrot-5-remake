import fs from "node:fs";
import path from "node:path";
import { copyFile, copyTree, root, run, tscCommand } from "./util.mjs";

const dist = path.join(root, "dist");
const generatedAssets = path.join(root, "assets/generated");
const generatedTargets = [
  dist,
  "model/dist",
  "dat/dist",
  "adventure/dist",
  "engine/dist",
  "editor/dist",
  "web/dist-src",
  "web/dist-vite",
].map((value) => (path.isAbsolute(value) ? value : path.join(root, value)));

for (const target of generatedTargets) {
  fs.rmSync(target, { recursive: true, force: true });
}

const tsc = tscCommand();

run(process.execPath, ["tools/src/build-custom-map-catalog.mjs"]);

// 产品构建只常驻编译纯模型与 Adventure；DAT 仅在确实需要重新生成官方资产时出现。
run(tsc, ["-b", "model", "adventure", "--force"]);

if (hasGeneratedAssets()) {
  console.log("检测到 assets/generated 已有内容，跳过资产生成。");
} else {
  run(tsc, ["-b", "dat", "--force"]);
  run(process.execPath, ["tools/src/extract-jars.mjs"]);
  run(process.execPath, ["tools/src/decode-levels.mjs"]);
  run(process.execPath, ["tools/src/build-assets.mjs"]);
  run(process.execPath, ["tools/src/build-adventure-catalog.mjs"]);
  run(process.execPath, ["tools/src/build-level-filters.mjs"]);
}

// Engine、Editor 和 Web 只消费纯 LevelMap 与已生成资产。
run(tsc, ["-b", "engine", "editor", "--force"]);
run("npm", ["run", "--workspace", "@bobby/web", "typecheck"]);
run("npm", ["run", "--workspace", "@bobby/web", "build"]);

fs.mkdirSync(dist, { recursive: true });

for (const file of [
  "index.html",
  "style.css",
  "game-ui.css",
  "level-filters.css",
  "adventure.css",
]) {
  copyFile(path.join(root, "web", file), path.join(dist, file));
}
copyFile(path.join(root, "editor/style.css"), path.join(dist, "editor.css"));

copyTree(path.join(root, "web/dist-vite"), dist);
copyTree(path.join(root, "model/dist"), path.join(dist, "model"));
copyTree(path.join(root, "adventure/dist"), path.join(dist, "adventure"));
copyTree(path.join(root, "engine/dist"), path.join(dist, "engine"));
copyTree(path.join(root, "editor/dist"), path.join(dist, "editor"));
copyTree(generatedAssets, path.join(dist, "assets"));

const tinySynthCandidates = [
  path.join(root, "node_modules/webaudio-tinysynth/webaudio-tinysynth.min.js"),
  path.join(root, "node_modules/webaudio-tinysynth/webaudio-tinysynth.js"),
];
const tinySynthSource = tinySynthCandidates.find((candidate) =>
  fs.existsSync(candidate),
);

if (tinySynthSource) {
  copyFile(
    tinySynthSource,
    path.join(dist, "vendor/webaudio-tinysynth.min.js"),
  );
} else {
  console.warn(
    "提示：当前环境未安装 webaudio-tinysynth；发布包将使用固定版本 CDN fallback。",
  );
}

console.log("Build complete: dist");

function hasGeneratedAssets() {
  return (
    fs.existsSync(generatedAssets) &&
    fs.readdirSync(generatedAssets).length > 0
  );
}
