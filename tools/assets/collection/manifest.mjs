import fs from "node:fs";
import path from "node:path";
import { root } from "../../lib/fs.mjs";
import {
  isCollectionVisible,
  normalizeCollectionVisibility,
} from "../../custom/collection-visibility.mjs";

const cardSizes = new Set(["small", "medium", "big"]);
const producerIds = new Set([
  "bc5",
  "directory",
  "loma",
  "novoban",
  "robo2",
]);

export function readCollectionManifest(repositoryRoot = root) {
  const file = path.join(repositoryRoot, "tools/assets/collections.json");
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    !manifest ||
    typeof manifest !== "object" ||
    manifest.schemaVersion !== 1 ||
    !Array.isArray(manifest.collections)
  ) {
    throw new Error(
      "tools/assets/collections.json 必须是 schemaVersion: 1 的 collection manifest",
    );
  }

  const ids = new Set();
  const collections = manifest.collections.map((entry) =>
    normalizeCollection(entry, ids),
  );
  return { schemaVersion: 1, collections };
}

export function visibleCollectionSummaries(manifest, development = false) {
  const visible = manifest.collections.filter((collection) =>
    isCollectionVisible(collection.visible, development),
  );
  return [
    ...visible.filter((collection) => collection.visible !== "dev"),
    ...visible.filter((collection) => collection.visible === "dev"),
  ].map(({ id, name }) => ({ id, name }));
}

function normalizeCollection(entry, ids) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("collection 定义必须是对象");
  }
  const {
    id,
    name,
    description = "",
    cardSize = "medium",
    producer,
    source,
    chapters,
  } = entry;
  if (!isSlug(id)) {
    throw new Error(`无效 collection ID：${String(id)}`);
  }
  if (ids.has(id)) {
    throw new Error(`重复 collection ID：${id}`);
  }
  ids.add(id);
  if (typeof name !== "string" || !name.trim()) {
    throw new Error(`${id}: name 不能为空`);
  }
  if (typeof description !== "string") {
    throw new Error(`${id}: description 必须是字符串`);
  }
  if (!cardSizes.has(cardSize)) {
    throw new Error(`${id}: cardSize 必须是 small / medium / big`);
  }
  if (!producerIds.has(producer)) {
    throw new Error(`${id}: 未知 producer ${String(producer)}`);
  }
  if (producer === "directory" && typeof source !== "string") {
    throw new Error(`${id}: directory producer 必须声明 source`);
  }
  return {
    id,
    name: name.trim(),
    description,
    cardSize,
    producer,
    ...(source ? { source } : {}),
    ...(chapters ? { chapters } : {}),
    visible: normalizeCollectionVisibility(entry.visible, id),
  };
}

function isSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
