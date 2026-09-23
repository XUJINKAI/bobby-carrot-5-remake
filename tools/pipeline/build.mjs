import fs from "node:fs";
import path from "node:path";
import {
  binCommand,
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
  "exchange/dist",
  "i18n/dist",
  "adventure/dist",
  "engine/dist",
  "editor/dist",
  "embed/dist",
].map((value) => (path.isAbsolute(value) ? value : path.join(root, value)));

for (const target of generatedTargets) {
  fs.rmSync(target, { recursive: true, force: true });
}

const tsc = tscCommand();

// Replay 验真依赖当前 Engine，因此在资产事务开始前建立全部 Runtime package。
// i18n 自己用 Vite 编译 TS 与 Markdown，并用 tsc 只生成声明。
run("npm", ["run", "build", "--workspace=@bobby/i18n"]);
run(tsc, [
  "-b",
  "model",
  "exchange",
  "adventure",
  "engine",
  "editor",
  "embed",
  "--force",
]);

// 正式构建从来源完整生成资产，并在临时目录内通过 Replay 验真后一次提交。
const { rebuildAssetsTransactionally } = await import(
  "../assets/pipeline.mjs"
);
const { markVerifiedMaps } = await import(
  "../replay/mark-verified-maps.mjs"
);
await rebuildAssetsTransactionally({
  beforeCommit: ({ repositoryRoot }) =>
    markVerifiedMaps({ repositoryRoot }),
});
run(binCommand("vue-tsc"), ["-b", "--force"], {
  cwd: path.join(root, "web"),
});
run(binCommand("vite"), ["build"], { cwd: path.join(root, "web") });
run(binCommand("vite"), ["build"], { cwd: path.join(root, "embed") });

copyTree(path.join(root, "model/dist"), path.join(dist, "model"));
copyTree(path.join(root, "exchange/dist"), path.join(dist, "exchange"));
copyTree(path.join(root, "i18n/dist"), path.join(dist, "i18n"));
copyTree(path.join(root, "adventure/dist"), path.join(dist, "adventure"));
copyTree(path.join(root, "engine/dist"), path.join(dist, "engine"));
copyTree(path.join(root, "editor/dist"), path.join(dist, "editor"));
copyTree(generatedAssets, path.join(dist, "assets"));

const { generateSeoArtifacts } = await import("./seo.mjs");
generateSeoArtifacts();

console.log("Build complete: dist");
