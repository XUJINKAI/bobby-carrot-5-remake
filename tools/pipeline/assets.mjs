import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const original = path.join(root, "original");
const assets = path.join(root, "assets");

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function rebuildAssets() {
  for (const directory of [
    "original/extracted",
    "original/decoded",
    "original/adapted",
    "assets",
  ]) {
    fs.rmSync(path.join(root, directory), { recursive: true, force: true });
  }
  run(process.execPath, ["tools/cli.mjs", "original", "prepare"]);
  prepareRuntimeAssets();
}

export function prepareRuntimeAssets() {
  fs.mkdirSync(assets, { recursive: true });
  copyTree(path.join(root, "project-assets"), assets);
  run(process.execPath, ["tools/custom/prepare.mjs"]);
  const catalog = JSON.parse(
    fs.readFileSync(path.join(original, "adapted/catalog.json"), "utf8"),
  );
  const runtimeCatalog = {
    ...catalog,
    levels: catalog.levels.map((level) => ({
      ...level,
      path: `maps/original/${level.publicId}.json`,
    })),
    specialScenes: catalog.specialScenes.map((scene) => ({
      ...scene,
      path: `maps/original/${scene.publicId}.json`,
    })),
  };
  const originalMaps = path.join(assets, "maps/original");
  fs.mkdirSync(originalMaps, { recursive: true });
  for (const level of [...catalog.levels, ...catalog.specialScenes]) {
    const source = path.join(original, "adapted", level.path);
    const target = path.join(originalMaps, `${level.publicId}.json`);
    const map = JSON.parse(fs.readFileSync(source, "utf8"));
    fs.writeFileSync(target, `${JSON.stringify(map, null, 2)}\n`);
  }
  copyTree(path.join(original, "adapted/art"), path.join(assets, "art"));
  copyTree(path.join(original, "adapted/audio"), path.join(assets, "audio"));
  fs.writeFileSync(
    path.join(assets, "maps/catalog.json"),
    `${JSON.stringify(runtimeCatalog, null, 2)}\n`,
  );
  run(process.execPath, ["tools/pipeline/level-filters.mjs"]);
  const filters = JSON.parse(
    fs.readFileSync(path.join(original, "adapted/level-filters.json"), "utf8"),
  );
  fs.writeFileSync(
    path.join(assets, "maps/filters.json"),
    `${JSON.stringify(filters, null, 2)}\n`,
  );
}

function copyTree(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareRuntimeAssets();
}
