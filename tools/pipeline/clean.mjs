import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";
for (const target of ["dist", "model/dist", "engine/dist", "editor/dist", "adventure/dist", "assets/art/hd", "assets/audio/midi", "assets/maps", "original/extracted", "original/decoded", "original/adapted"]) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}
console.log("已清理构建产物。");
