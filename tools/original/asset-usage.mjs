import fs from "node:fs";
import path from "node:path";
import {
  coordinateSurfaceType,
  surfaceMappingForTs,
} from "@bobby/model";
import { root } from "../lib/fs.mjs";

const RUNTIME_VISUALS_BY_TS = new Map([
  ["14,8", { type: "dragon", label: "Dragon head 基础帧" }],
  ["15,9", { type: "dragon", label: "Dragon head 吐火第一帧" }],
  ["15,10", { type: "dragon", label: "Dragon head 吐火第二帧" }],
]);

export function parseTsAssetQuery(value) {
  const input = String(value ?? "").trim().toLowerCase();
  const match = /^(?:ts[-(](\d+)[-,](\d+)\)?|surface-(\d+)-(\d+))$/.exec(input);
  if (!match)
    throw new Error(
      "素材坐标格式应为 ts-<row>-<column>、ts(<row>,<column>) 或 surface-<row>-<column>",
    );
  const row = Number(match[1] ?? match[3]);
  const column = Number(match[2] ?? match[4]);
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(column) ||
    row < 1 ||
    row > 16 ||
    column < 1 ||
    column > 16
  )
    throw new Error(`ts.png 素材坐标超出 1~16：${row},${column}`);
  return { row, column };
}

export function findOriginalTsUsage(catalog, readMap, coordinate) {
  const mapping = surfaceMappingForTs(coordinate.row, coordinate.column);
  const selector = mapping
    ? {
      type: mapping.type,
      fields: mapping.fields ?? {},
    }
    : {
        type: coordinateSurfaceType(coordinate.row, coordinate.column),
        fields: {},
      };
  const entries = [...catalog.maps, ...catalog.specialScenes];
  const runtimeVisual = RUNTIME_VISUALS_BY_TS.get(
    `${coordinate.row},${coordinate.column}`,
  );
  const maps = [];
  let occurrenceCount = 0;

  for (const entry of entries) {
    const document = readMap(entry);
    const directOccurrences = document.entities
      .filter((entity) => matchesSelector(entity, selector))
      .map((entity) => ({ x: entity.x, y: entity.y }));
    const runtimeOccurrences = runtimeVisual
      ? document.entities
          .filter((entity) => entity.type === runtimeVisual.type)
          .map((entity) => ({
            x: entity.x,
            y: entity.y,
            usage: runtimeVisual.label,
          }))
      : [];
    const occurrences = [...directOccurrences, ...runtimeOccurrences];
    if (occurrences.length === 0) continue;
    occurrenceCount += occurrences.length;
    maps.push({
      id: entry.id,
      name: document.meta?.name ?? entry.id,
      ...(entry.chapter ? { chapter: entry.chapter } : {}),
      ...(entry.kind ? { kind: entry.kind } : { kind: "special-scene" }),
      source: entry.source,
      occurrences,
    });
  }

  return {
    query: {
      atlas: "ts.png",
      row: coordinate.row,
      column: coordinate.column,
      label: `ts-${coordinate.row}-${coordinate.column}`,
    },
    selector,
    ...(runtimeVisual ? { runtimeVisual } : {}),
    mapCount: maps.length,
    occurrenceCount,
    maps,
  };
}

export function loadOriginalTsUsage(value) {
  const { adaptedRoot, catalog } = loadAdaptedCatalog();
  return findOriginalTsUsage(
    catalog,
    (entry) => readJson(path.join(adaptedRoot, entry.path)),
    parseTsAssetQuery(value),
  );
}

export function loadOriginalTemporarySurfaceUsage() {
  const { adaptedRoot, catalog } = loadAdaptedCatalog();
  const byType = new Map();
  for (const entry of [...catalog.maps, ...catalog.specialScenes]) {
    const document = readJson(path.join(adaptedRoot, entry.path));
    const counts = new Map();
    for (const entity of document.entities) {
      if (!/^surface-\d+-\d+$/.test(entity.type)) continue;
      counts.set(entity.type, (counts.get(entity.type) ?? 0) + 1);
    }
    for (const [type, count] of counts) {
      const item = byType.get(type) ?? {
        type,
        label: type.replace("surface-", "ts-"),
        mapCount: 0,
        occurrenceCount: 0,
        maps: [],
      };
      item.mapCount += 1;
      item.occurrenceCount += count;
      item.maps.push(entry.id);
      byType.set(type, item);
    }
  }
  const surfaces = [...byType.values()].sort(compareTemporarySurfaces);
  return {
    temporarySurfaceCount: surfaces.length,
    surfaces,
  };
}

export function formatOriginalTemporarySurfaceUsage(result) {
  const lines = [`临时 Surface：${result.temporarySurfaceCount} 种`];
  for (const surface of result.surfaces)
    lines.push(
      `${surface.label} → ${surface.type}：${surface.mapCount} 张地图，${surface.occurrenceCount} 个 anchor`,
    );
  lines.push("逐项反查：npm run original:usage -- ts-<row>-<column>");
  return `${lines.join("\n")}\n`;
}

function loadAdaptedCatalog() {
  const adaptedRoot = path.join(root, "original/adapted");
  const catalogPath = path.join(adaptedRoot, "catalog.json");
  if (!fs.existsSync(catalogPath))
    throw new Error("缺少 Original Adapter 生成物；请先执行 npm run assets");
  const catalog = readJson(catalogPath);
  if (
    catalog.schemaVersion !== 1 ||
    !Array.isArray(catalog.maps) ||
    !Array.isArray(catalog.specialScenes)
  )
    throw new Error("Original adapted catalog 合同无效；请重新执行 npm run assets");
  return { adaptedRoot, catalog };
}

export function formatOriginalTsUsage(result) {
  const fieldText = Object.entries(result.selector.fields)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(", ");
  const selectorText = fieldText
    ? `${result.selector.type} (${fieldText})`
    : result.selector.type;
  const lines = [
    `${result.query.label} → ${selectorText}`,
    ...(result.runtimeVisual
      ? [
          `Runtime 视觉：${result.runtimeVisual.type}（${result.runtimeVisual.label}）`,
        ]
      : []),
    `引用：${result.mapCount} 张地图，${result.occurrenceCount} 个 Entity anchor`,
  ];
  for (const map of result.maps) {
    const positions = map.occurrences
      .map(({ x, y, usage }) =>
        usage ? `(${x},${y}; ${usage})` : `(${x},${y})`,
      )
      .join(" ");
    const source = map.source;
    const provenance = source
      ? `${source.release}/${source.packFile}.dat#${source.levelIndex}`
      : "未知来源";
    lines.push(
      `${map.id} [${map.kind}] ${positions}  ${provenance}  /explore/play/original/${map.id}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

function matchesSelector(entity, selector) {
  if (entity.type !== selector.type) return false;
  return Object.entries(selector.fields).every(
    ([key, value]) => entity[key] === value,
  );
}

function compareTemporarySurfaces(left, right) {
  const leftCoordinate = parseTsAssetQuery(left.type);
  const rightCoordinate = parseTsAssetQuery(right.type);
  return (
    leftCoordinate.row - rightCoordinate.row ||
    leftCoordinate.column - rightCoordinate.column
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
