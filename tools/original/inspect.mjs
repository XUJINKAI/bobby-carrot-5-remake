import fs from "node:fs";
import path from "node:path";
import { root } from "../lib/fs.mjs";
import { encodeDatTerrain, encodeDatObject } from "./dat/index.mjs";

const showAll = process.argv.includes("--all");
const previewLimit = 2;
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "original/adapted/catalog.json"), "utf8"),
);
if (catalog.schemaVersion !== 1)
  throw new Error("Original adapted catalog schemaVersion 必须为 1");
const byType = new Map();

function add(kind, type, map, x, y) {
  if (!/^(?:walkable|background|object)-variant-/.test(type)) return;
  const key = `${kind}:${type}`;
  const item = byType.get(key) ?? {
    kind,
    type,
    dat: kind === "terrain" ? encodeDatTerrain(type) : encodeDatObject(type),
    count: 0,
    maps: new Map(),
    samples: [],
  };
  item.count += 1;
  item.maps.set(map.id, (item.maps.get(map.id) ?? 0) + 1);
  item.samples.push({ map: map.id, x, y });
  byType.set(key, item);
}

for (const meta of catalog.maps) {
  const document = JSON.parse(
    fs.readFileSync(path.join(root, "original/adapted", meta.path), "utf8"),
  );
  for (let y = 0; y < document.height; y += 1) {
    for (let x = 0; x < document.width; x += 1)
      add("terrain", document.terrain[y][x], meta, x, y);
  }
  for (const object of document.objects)
    add("object", object.type, meta, object.x, object.y);
}

const result = [...byType.values()]
  .sort((a, b) => a.dat - b.dat)
  .map((item) => {
    const maps = [...item.maps.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([map, count]) => ({ map, count }));
    return {
      kind: item.kind,
      type: item.type,
      dat: item.dat,
      datHex: `0x${item.dat.toString(16).toUpperCase().padStart(2, "0")}`,
      count: item.count,
      mapCount: item.maps.size,
      maps: showAll ? maps : maps.slice(0, previewLimit),
      samples: showAll ? item.samples : item.samples.slice(0, previewLimit),
      ...(!showAll &&
      (maps.length > previewLimit || item.samples.length > previewLimit)
        ? { truncated: true }
        : {}),
    };
  });

fs.mkdirSync(path.join(root, "tmp"), { recursive: true });
fs.writeFileSync(
  path.join(root, "tmp/unknown-tiles.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    {
      unknownTypes: result.length,
      terrainTypes: result.filter((item) => item.kind === "terrain").length,
      objectTypes: result.filter((item) => item.kind === "object").length,
      output: "tmp/unknown-tiles.json",
      detail: showAll
        ? "all maps and samples"
        : `first ${previewLimit} maps and samples per type (use --all for everything)`,
    },
    null,
    2,
  ),
);
