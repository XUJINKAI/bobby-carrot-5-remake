import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";
for (const target of ["dist", "model/dist", "tools/original/dat/dist", "engine/dist", "editor/dist", "adventure/dist", "web/dist-src", "web/dist-vite"]) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}
console.log("已清理构建产物。");
