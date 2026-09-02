import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeDatLevelRecord,
  encodeDatLevelRecord,
  replaceDatLevelRecord,
  splitDatPackage,
} from "./dat/index.mjs";
import { adaptLegacyMap } from "./entity-adapter.mjs";
import { reverseEntityMap } from "./entity-reverse-adapter.mjs";
import { RELEASES } from "./source-definitions.mjs";
import { patchZipEntries, readZipEntry } from "../lib/zip-patch.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = parseArgs(process.argv.slice(2));
const inputDir = path.resolve(
  args.in ?? path.join(root, "custom-maps/original-patch"),
);
const outputDir = path.resolve(
  args.out ?? path.join(root, "tmp/original-patch"),
);
validateDirectories(inputDir, outputDir);

const catalog = readJson(path.join(root, "original/adapted/catalog.json"));
if (catalog.schemaVersion !== 1)
  throw new Error("Original adapted catalog schemaVersion 必须为 1");
const maps = readPatchMaps(inputDir, catalog);

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
const patchTimestamp = formatPatchTimestamp(new Date());
for (const [releaseId, replacements] of groupByRelease(maps)) {
  const release = RELEASES.find((item) => item.id === releaseId);
  if (!release) throw new Error(`未知原版 release：${releaseId}`);
  const original = path.join(root, "original/official-hd", release.jar);
  const replacementEntries = patchDatEntries(original, replacements);
  const patched = patchZipEntries(fs.readFileSync(original), replacementEntries, {
    removeSignatures: true,
  });
  const out = path.join(
    outputDir,
    `${releaseId}-patched-${patchTimestamp}.jar`,
  );
  fs.writeFileSync(out, patched.buffer);
  verifyPatchedJar(out, replacements);
  console.log(
    `${path.relative(root, out)}: ${replacements.map((item) => item.id).join(", ")} · Entity Map round-trip: OK${patched.removedSignatures.length ? ` · 已移除失效签名：${patched.removedSignatures.join(", ")}` : ""}`,
  );
}

function readPatchMaps(directory, catalog) {
  if (!fs.statSync(directory).isDirectory())
    throw new Error(`Patch 输入必须是目录：${directory}`);
  const targets = new Map(catalog.maps.map((map) => [map.id, map]));
  const files = listJsonFiles(directory);
  if (files.length === 0) throw new Error(`Patch 输入目录不含 JSON 地图：${directory}`);
  const seen = new Set();
  return files.map((file) => {
    const id = path.basename(file, ".json").toLowerCase();
    if (seen.has(id)) throw new Error(`Patch 输入包含重复地图名：${id}`);
    seen.add(id);
    const target = targets.get(id);
    if (!target?.source) throw new Error(`地图名不是可 patch 的 Campaign ID：${id}`);
    return { id, source: target.source, map: readJson(file) };
  });
}

function groupByRelease(maps) {
  const groups = new Map();
  for (const map of maps) {
    const group = groups.get(map.source.release) ?? [];
    group.push(map);
    groups.set(map.source.release, group);
  }
  return [...groups].sort(([left], [right]) => left.localeCompare(right));
}

function patchDatEntries(original, maps) {
  const jar = fs.readFileSync(original);
  const byEntry = new Map();
  for (const item of maps) {
    const entry = `${item.source.packFile}.dat`;
    const current = byEntry.get(entry) ?? readZipEntry(jar, entry);
    const replacement = Buffer.from(encodeDatLevelRecord(reverseEntityMap(item.map)));
    byEntry.set(
      entry,
      replaceDatLevelRecord(current, item.source.levelIndex, replacement),
    );
  }
  return byEntry;
}

function verifyPatchedJar(file, maps) {
  const jar = fs.readFileSync(file);
  for (const item of maps) {
    const entry = `${item.source.packFile}.dat`;
    const record = splitDatPackage(readZipEntry(jar, entry)).levelRecords[
      item.source.levelIndex - 1
    ];
    if (!record) throw new Error(`Patch 后缺少 ${item.id} 的 DAT record`);
    const decoded = adaptLegacyMap(decodeDatLevelRecord(record).map);
    const expected = adaptLegacyMap(reverseEntityMap(item.map));
    if (
      JSON.stringify(normalizeEntityMap(decoded)) !==
      JSON.stringify(normalizeEntityMap(expected))
    )
      throw new Error(`Patch 后 ${item.id} 的 Entity Map round-trip 校验失败`);
  }
}

function normalizeEntityMap(map) {
  return {
    width: map.width,
    height: map.height,
    entities: map.entities
      .map((entity) => ({
        type: entity.type,
        x: entity.x,
        y: entity.y,
        ...(entity.direction ? { direction: entity.direction } : {}),
        ...(entity.properties ? { properties: entity.properties } : {}),
        ...(entity.traits ? { traits: entity.traits } : {}),
        ...(entity.state ? { state: entity.state } : {}),
      }))
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
  };
}

function listJsonFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJsonFiles(target);
    return entry.isFile() && path.extname(entry.name).toLowerCase() === ".json"
      ? [target]
      : [];
  });
}

function validateDirectories(input, output) {
  if (!fs.existsSync(input)) throw new Error(`Patch 输入目录不存在：${input}`);
  if (
    input === output ||
    output.startsWith(`${input}${path.sep}`) ||
    input.startsWith(`${output}${path.sep}`)
  )
    throw new Error("Patch 输出目录不能是输入目录或其子目录");
  const tmp = path.join(root, "tmp");
  if (output === tmp || !output.startsWith(`${tmp}${path.sep}`))
    throw new Error("Patch 输出目录必须位于 tmp 的子目录中");
  const official = path.join(root, "original/official-hd");
  if (
    [path.parse(output).root, root, official].includes(output) ||
    output.startsWith(`${official}${path.sep}`)
  )
    throw new Error("Patch 输出目录必须是安全的生成目录");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function formatPatchTimestamp(date) {
  const number = (value) => String(value).padStart(2, "0");
  const day = [
    date.getFullYear(),
    number(date.getMonth() + 1),
    number(date.getDate()),
  ].join("");
  const time = [
    number(date.getHours()),
    number(date.getMinutes()),
    number(date.getSeconds()),
  ].join("");
  return `${day}-${time}`;
}

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key?.startsWith("--")) continue;
    const value = values[++index];
    if (!value || value.startsWith("--")) throw new Error(`${key} 缺少目录参数`);
    result[key.slice(2)] = value;
  }
  return result;
}
