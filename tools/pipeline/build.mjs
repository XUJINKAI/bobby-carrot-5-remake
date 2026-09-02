import fs from "node:fs";
import path from "node:path";
import {
  binCommand,
  copyTree,
  root,
  run,
  tscCommand,
} from "../lib/fs.mjs";
import { generateSeoArtifacts } from "./seo.mjs";

const dist = path.join(root, "dist");
const generatedAssets = path.join(root, "assets");
const generatedTargets = [
  dist,
  "model/dist",
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

// 产品构建只常驻编译纯模型、i18n 与 Adventure；DAT 仅在确实需要重新生成官方资产时出现。
run(tsc, ["-b", "model", "i18n", "adventure", "--force"]);
run(process.execPath, ["tools/cli.mjs", "assets", "prepare"]);

// Engine、Editor 和 Web 只消费纯 LevelMap 与已生成资产。
run(tsc, ["-b", "engine", "editor", "embed", "--force"]);
run(binCommand("vue-tsc"), ["-b", "--force"], {
  cwd: path.join(root, "web"),
});
run(binCommand("vite"), ["build"], { cwd: path.join(root, "web") });
run(binCommand("vite"), ["build"], { cwd: path.join(root, "embed") });

copyTree(path.join(root, "model/dist"), path.join(dist, "model"));
copyTree(path.join(root, "i18n/dist"), path.join(dist, "i18n"));
copyTree(path.join(root, "adventure/dist"), path.join(dist, "adventure"));
copyTree(path.join(root, "engine/dist"), path.join(dist, "engine"));
copyTree(path.join(root, "editor/dist"), path.join(dist, "editor"));
copyTree(generatedAssets, path.join(dist, "assets"));

generateSeoArtifacts();

console.log("Build complete: dist");
