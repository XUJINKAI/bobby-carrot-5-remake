import fs from "node:fs";
import path from "node:path";
import { parseMapDocument, serializeMapDocument } from "@bobby/model";
import {
  publishDirectoryAtomically,
  publishFileAtomically,
} from "../orchestrator/atomic-output.mjs";

export function publishCollection({
  collection,
  prepared,
  outputRoot,
  stagingRoot,
}) {
  validatePreparedCollection(collection, prepared);
  const normalizedMaps = prepared.maps.map((entry) => ({
    ...entry,
    document: parseMapDocument(entry.document),
  }));
  publishDirectoryAtomically({
    stagingRoot,
    target: path.join(outputRoot, collection.id),
    write(directory) {
      for (const map of normalizedMaps) {
        fs.writeFileSync(
          path.join(directory, `${map.id}.json`),
          serializeMapDocument(map.document),
        );
      }
      fs.writeFileSync(
        path.join(directory, "index.json"),
        `${JSON.stringify(collectionIndex(collection, prepared, normalizedMaps), null, 2)}\n`,
      );
    },
  });
}

export function publishDiscoveryIndex({
  collections,
  outputRoot,
}) {
  publishFileAtomically({
    target: path.join(outputRoot, "index.json"),
    content: `${JSON.stringify({ schemaVersion: 1, collections }, null, 2)}\n`,
  });
}

function collectionIndex(collection, prepared, maps) {
  return {
    schemaVersion: 1,
    name: collection.name,
    ...(collection.description
      ? { description: collection.description }
      : {}),
    cardSize: collection.cardSize,
    filters: prepared.filters ?? [],
    chapters: prepared.chapters ?? [],
    maps: maps.map((entry) => ({
      id: entry.id,
      name: entry.document.meta?.name ?? "",
      ...(entry.description ? { description: entry.description } : {}),
      ...(entry.chapter ? { chapter: entry.chapter } : {}),
      ...(entry.filters ? { filters: entry.filters } : {}),
    })),
  };
}

function validatePreparedCollection(collection, prepared) {
  if (!prepared || !Array.isArray(prepared.maps) || prepared.maps.length === 0) {
    throw new Error(`${collection.id}: Producer 至少需要返回一张地图`);
  }
  const ids = new Set();
  for (const map of prepared.maps) {
    if (!map || !isSlug(map.id)) {
      throw new Error(`${collection.id}: 无效地图 ID ${String(map?.id)}`);
    }
    if (ids.has(map.id)) {
      throw new Error(`${collection.id}: 重复地图 ID ${map.id}`);
    }
    ids.add(map.id);
  }
}

function isSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
