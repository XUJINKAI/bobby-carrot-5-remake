import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const generatedDirectories = [
  "dist",
  "model/dist",
  "i18n/dist",
  "engine/dist",
  "editor/dist",
  "adventure/dist",
  "embed/dist",
  "original/extracted",
  "original/decoded",
  "original/adapted",
  "custom-maps/loma-pushbox",
  "custom-maps/novoban-pushbox",
  "assets/art/hd",
  "assets/audio/midi",
  "assets/maps",
  "assets/adventure",
];

for (const target of generatedDirectories) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}
removeBuildMetadata(root);
console.log("已清理所有可重建生成物。");

function removeBuildMetadata(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      removeBuildMetadata(target);
      continue;
    }
    if (entry.name.endsWith(".tsbuildinfo")) {
      fs.rmSync(target, { force: true });
    }
  }
}
