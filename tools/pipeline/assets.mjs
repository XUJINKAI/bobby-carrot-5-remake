import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { levelFeatures } from "./collection-metadata.mjs";

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
    cleanUntracked(directory);
  }
  prepareAssets();
}

export function prepareAssets() {
  // prepare 的合同是保证所有派生层与源码同步，不能用目录存在性替代新鲜度判断。
  run(process.execPath, ["tools/cli.mjs", "original", "prepare"]);
  fs.mkdirSync(assets, { recursive: true });
  for (const obsolete of ["catalog.json", "custom-catalog.json", "filters.json"])
    fs.rmSync(path.join(assets, "maps", obsolete), { force: true });
  run(process.execPath, ["tools/custom/prepare.mjs"]);
  const catalog = JSON.parse(
    fs.readFileSync(path.join(original, "adapted/catalog.json"), "utf8"),
  );
  const originalMaps = path.join(assets, "maps/original");
  fs.rmSync(originalMaps, { recursive: true, force: true });
  fs.mkdirSync(originalMaps, { recursive: true });
  const runtimeCatalog = {
    ...catalog,
    id: "original",
    name: "原版关卡",
    levels: catalog.levels.map((level) => {
      const map = readAdaptedMap(level);
      fs.writeFileSync(
        path.join(originalMaps, `${level.publicId}.json`),
        `${JSON.stringify(map, null, 2)}\n`,
      );
      return {
        ...level,
        ...levelFeatures(map),
        path: `maps/original/${level.publicId}.json`,
      };
    }),
    specialScenes: catalog.specialScenes.map((scene) => ({
      ...scene,
      path: `maps/original/${scene.publicId}.json`,
    })),
  };
  for (const scene of catalog.specialScenes) {
    const map = readAdaptedMap(scene);
    fs.writeFileSync(
      path.join(originalMaps, `${scene.publicId}.json`),
      `${JSON.stringify(map, null, 2)}\n`,
    );
  }
  for (const target of ["art/hd", "audio/midi"])
    fs.rmSync(path.join(assets, target), { recursive: true, force: true });
  copyTree(path.join(original, "adapted/art"), path.join(assets, "art"));
  copyTree(path.join(original, "adapted/audio"), path.join(assets, "audio"));
  fs.writeFileSync(
    path.join(originalMaps, "index.json"),
    `${JSON.stringify(runtimeCatalog, null, 2)}\n`,
  );
}

function readAdaptedMap(item) {
  return JSON.parse(
    fs.readFileSync(path.join(original, "adapted", item.path), "utf8"),
  );
}

function cleanUntracked(directory) {
  run("git", ["clean", "-fdX", "--", directory]);
}

function copyTree(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareAssets();
}
