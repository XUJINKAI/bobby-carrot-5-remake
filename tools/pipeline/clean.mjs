import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";

const generatedDirectories = [
  "original/extracted",
  "original/decoded",
  "original/adapted",
  "custom-maps/loma-pushbox",
  "custom-maps/novoban-pushbox",
  "assets/art/hd",
  "assets/audio/midi",
  "assets/maps",
  "assets/adventure",
  "tmp/assets-prepare",
];

for (const target of workspaceDistDirectories()) {
  fs.rmSync(target, { recursive: true, force: true });
}
for (const target of generatedDirectories) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}
removeBuildMetadata(root);
console.log("已清理所有可重建生成物。");

function workspaceDistDirectories() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  if (!Array.isArray(manifest.workspaces)) {
    throw new Error("根 package.json 必须使用 workspaces 数组");
  }
  const directories = [path.join(root, "dist")];
  for (const workspace of manifest.workspaces) {
    if (
      typeof workspace !== "string" ||
      !/^[a-z0-9][a-z0-9-]*$/.test(workspace)
    ) {
      throw new Error(`clean 不支持的 workspace 路径：${String(workspace)}`);
    }
    directories.push(path.join(root, workspace, "dist"));
  }
  return directories;
}

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
