import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  encodeDatLevelRecord,
  decodeDatLevelRecord,
  replaceDatLevelRecord,
  splitDatPackage,
} from "./dat/index.mjs";
import { RELEASES } from "./source-definitions.mjs";
import { patchZipEntries, readZipEntry } from "../lib/zip-patch.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = parseArgs(process.argv.slice(2));
if (!args.map || !args.target) usage();

const input = JSON.parse(fs.readFileSync(path.resolve(args.map), "utf8"));
const map = readSemanticLevelMap(input);
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "original/adapted/catalog.json"), "utf8"),
);
if (catalog.schemaVersion !== 1)
  throw new Error("Original adapted catalog schemaVersion 必须为 1");
const targetId = String(args.target).toLowerCase();
const meta = catalog.maps.find((item) => item.id === targetId);
if (!meta) throw new Error(`Unknown Campaign map target: ${args.target}`);
const source = meta.source;
if (!source) throw new Error(`Target has no original source: ${args.target}`);
const release = RELEASES.find((item) => item.id === source.release);
if (!release) throw new Error(`Unknown original release: ${source.release}`);

const original = path.join(root, "original/official-hd", release.jar);
const out = path.resolve(
  args.out ??
    path.join(
      root,
      "tmp/original-validation",
      `${path.basename(args.map, path.extname(args.map))}-${meta.id}.jar`,
    ),
);
if (
  out === path.resolve(original) ||
  out.startsWith(path.resolve(path.join(root, "original/official-hd")) + path.sep)
)
  throw new Error("Validation output must never overwrite original/official-hd");
fs.mkdirSync(path.dirname(out), { recursive: true });

const jar = fs.readFileSync(original);
const entry = `${source.packFile}.dat`;
const dat = readZipEntry(jar, entry);
const replacement = Buffer.from(encodeDatLevelRecord(map));
const patchedDat = Buffer.from(
  replaceDatLevelRecord(dat, source.levelIndex, replacement),
);
const patched = patchZipEntries(jar, new Map([[entry, patchedDat]]), {
  removeSignatures: true,
});
fs.writeFileSync(out, patched.buffer);

const verifyJar = fs.readFileSync(out);
const verifyDat = readZipEntry(verifyJar, entry);
const record = splitDatPackage(verifyDat).levelRecords[source.levelIndex - 1];
if (!record) throw new Error("Patched DAT target disappeared");
const decoded = decodeDatLevelRecord(record).map;
if (JSON.stringify(decoded) !== JSON.stringify(map))
  throw new Error("Patched JAR semantic round-trip verification failed");

console.log(`Original validation JAR: ${path.relative(root, out)}`);
console.log(
  `Patched ${release.jar} / ${entry} / level ${source.levelIndex} (${meta.id})`,
);
console.log(
  `Semantic round-trip: OK${patched.removedSignatures.length ? ` · removed invalid signatures: ${patched.removedSignatures.join(", ")}` : ""}`,
);

function readSemanticLevelMap(value) {
  if (!value || typeof value !== "object")
    throw new Error("Map JSON must be an object");
  if (value.schemaVersion !== 1)
    throw new Error(
      `Unsupported map schemaVersion: ${String(value.schemaVersion)}; expected 1`,
    );
  const width = Number(value.width);
  const height = Number(value.height);
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 255 ||
    height > 255
  )
    throw new Error(
      "DAT validation map dimensions must be integer values between 1 and 255",
    );
  if (!Array.isArray(value.terrain) || value.terrain.length !== height)
    throw new Error("Map terrain height does not match height");
  const terrain = value.terrain.map((row, y) => {
    if (!Array.isArray(row) || row.length !== width)
      throw new Error(`Map terrain row ${y} does not match width`);
    return row.map((type, x) => {
      if (typeof type !== "string" || !type)
        throw new Error(`Map terrain ${x},${y} must use a semantic string ID`);
      return type;
    });
  });
  if (!Array.isArray(value.objects))
    throw new Error("Map objects must be an array");
  const objects = value.objects.map((object, index) => {
    if (
      !object ||
      typeof object !== "object" ||
      typeof object.type !== "string" ||
      !object.type
    )
      throw new Error(`Map object ${index} must use a semantic string type`);
    const x = Number(object.x);
    const y = Number(object.y);
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= width ||
      y >= height
    )
      throw new Error(`Map object ${index} has invalid coordinates`);
    return { type: object.type, x, y };
  });
  return { width, height, terrain, objects };
}

function parseArgs(values) {
  const out = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key?.startsWith("--")) continue;
    out[key.slice(2)] = values[++index];
  }
  return out;
}

function usage() {
  throw new Error(
    "Usage: npm run original:patch -- --map <map-v1.json> --target <campaign-id> [--out <validation.jar>]",
  );
}
