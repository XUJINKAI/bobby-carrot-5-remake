import fs from "node:fs";
import path from "node:path";
import {
  binCommand,
  copyFile,
  copyTree,
  root,
  run,
  tscCommand,
} from "../lib/fs.mjs";

const dist = path.join(root, "dist");
const generatedAssets = path.join(root, "assets");
const generatedTargets = [
  dist,
  "model/dist",
  "adventure/dist",
  "engine/dist",
  "editor/dist",
].map((value) => (path.isAbsolute(value) ? value : path.join(root, value)));

for (const target of generatedTargets) {
  fs.rmSync(target, { recursive: true, force: true });
}

const tsc = tscCommand();

// 产品构建只常驻编译纯模型与 Adventure；DAT 仅在确实需要重新生成官方资产时出现。
run(tsc, ["-b", "model", "adventure", "--force"]);
run(process.execPath, ["tools/cli.mjs", "assets", "prepare"]);

// Engine、Editor 和 Web 只消费纯 LevelMap 与已生成资产。
run(tsc, ["-b", "engine", "editor", "--force"]);
run(binCommand("vue-tsc"), ["-b", "--force"], {
  cwd: path.join(root, "web"),
});
run(binCommand("vite"), ["build"], { cwd: path.join(root, "web") });

copyTree(path.join(root, "model/dist"), path.join(dist, "model"));
copyTree(path.join(root, "adventure/dist"), path.join(dist, "adventure"));
copyTree(path.join(root, "engine/dist"), path.join(dist, "engine"));
copyTree(path.join(root, "editor/dist"), path.join(dist, "editor"));
copyTree(generatedAssets, path.join(dist, "assets"));

// Fragment 不会发送给静态服务器，因此分享入口需要真实 HTML 文件。
const importEntry = path.join(dist, "import/v1/index.html");
fs.mkdirSync(path.dirname(importEntry), { recursive: true });
copyFile(path.join(dist, "index.html"), importEntry);

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
