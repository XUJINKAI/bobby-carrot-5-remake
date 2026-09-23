import fs from "node:fs";
import path from "node:path";
import { root } from "../../lib/fs.mjs";
import { encodeDatTerrain } from "../dat/index.mjs";

const previewLimit = 2;
export function inspectOriginal({ repositoryRoot = root, showAll = false } = {}) {
  const adaptedRoot = path.join(repositoryRoot, "tmp/assets/bc5/adapted");
  const catalog = JSON.parse(
    fs.readFileSync(path.join(adaptedRoot, "catalog.json"), "utf8"),
  );
  if (catalog.schemaVersion !== 1) {
    throw new Error("Original adapted catalog schemaVersion 必须为 1");
  }
  const byType = new Map();

  for (const meta of [...catalog.maps, ...(catalog.specialScenes ?? [])]) {
    const document = JSON.parse(
      fs.readFileSync(path.join(adaptedRoot, meta.path), "utf8"),
    );
    for (const entity of document.entities ?? []) {
      if (entity.type !== "original-tile") continue;
      addOriginalTile(byType, entity.variant, meta, entity.x, entity.y);
    }
  }

  const result = [...byType.values()]
    .sort((left, right) => left.dat - right.dat)
    .map((item) => presentItem(item, showAll));

  fs.mkdirSync(path.join(repositoryRoot, "tmp"), { recursive: true });
  fs.writeFileSync(
    path.join(repositoryRoot, "tmp/unknown-tiles.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(
    JSON.stringify(
      {
        unknownTypes: result.length,
        terrainTypes: result.length,
        objectTypes: 0,
        output: "tmp/unknown-tiles.json",
        detail: showAll
          ? "all maps and samples"
          : `first ${previewLimit} maps and samples per type (use --all for everything)`,
      },
      null,
      2,
    ),
  );
  return result;
}

function addOriginalTile(byType, variant, map, x, y) {
  const dat = encodeDatTerrain(variant);
  const item = byType.get(variant) ?? {
    kind: "terrain",
    type: "original-tile",
    variant,
    dat,
    count: 0,
    maps: new Map(),
    samples: [],
  };
  item.count += 1;
  item.maps.set(map.id, (item.maps.get(map.id) ?? 0) + 1);
  item.samples.push({ map: map.id, x, y });
  byType.set(variant, item);
}

function presentItem(item, showAll) {
  const maps = [...item.maps.entries()]
    .sort(
      (left, right) =>
        right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .map(([map, count]) => ({ map, count }));
  return {
    kind: item.kind,
    type: item.type,
    variant: item.variant,
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
}
