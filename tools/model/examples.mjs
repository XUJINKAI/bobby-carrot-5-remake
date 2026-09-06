import fs from "node:fs";
import path from "node:path";
import {
  ENTITY_MAP_DEFINITIONS,
  ENTITY_MAP_MIGRATION_ALIASES,
  ENTITY_MAP_UNRESOLVED_SOURCES,
  LEVEL_ENTITY_RESERVED_FIELDS,
  entityMapDefinition,
} from "@bobby/model";
import { root } from "../lib/fs.mjs";

// Review mirror of adventure/src/save.ts. During this schema-only phase we do not build @bobby/adventure,
// because Adventure still consumes the old LevelEntity shape. The migration phase will replace this mirror
// with direct imports plus consistency tests.
const ADVENTURE_EVENT_IDS = ["bonus-key-trial"];
const ADVENTURE_ITEM_IDS = [
  "golden-key",
  "speed-shoes",
  "coin-radar",
  "stereo",
  "night-train-map-1",
  "night-train-map-2",
];

const STORAGE_KEYS = {
  adventure: "bc5r:adventure",
  explore: "bc5r:explore/<collection>",
  editorAutosave: "bc5r:editor/autosave",
  editorNamed: "bc5r:editor/<name>",
};

const requestedType = process.argv[2];
if (requestedType) {
  const definition = entityMapDefinition(requestedType);
  if (!definition) throw new Error(`Unknown map entity type: ${requestedType}`);
  process.stdout.write(`${JSON.stringify({ contract: contractView(definition), examples: examplesForDefinition(definition) }, null, 2)}\n`);
} else {
  generateAll();
}

function generateAll() {
  const outputDir = path.join(root, "tmp/schema");
  const examplesDir = path.join(outputDir, "examples");
  const reviewDir = path.join(outputDir, "review");
  fs.mkdirSync(examplesDir, { recursive: true });
  fs.mkdirSync(reviewDir, { recursive: true });

  const mapDocument = mapDocumentExample();
  const levelMap = withoutMeta(mapDocument);
  const manifest = collectionManifestExample();
  const collectionsIndex = collectionsIndexExample();
  const collectionIndex = collectionIndexExample();
  const adventureSave = adventureSaveExample();
  const exploreCollection = exploreCollectionExample();
  const exploreSnapshot = {
    original: { schemaVersion: 1, completedMaps: ["1-1", "1-2"], lastMap: "1-3" },
    "original-patch": exploreCollection,
  };
  const editorSnapshot = {
    autosave: mapDocument,
    saves: {
      "carousel-lab": {
        ...mapDocument,
        meta: { ...mapDocument.meta, name: "Carousel Lab Saved Copy" },
      },
    },
  };
  const storageContract = {
    keys: STORAGE_KEYS,
    editorPolicy: {
      autosave: "Typing/editing only overwrites bc5r:editor/autosave.",
      namedSave: "Save / Save As explicitly writes bc5r:editor/<name>.",
      loadNamedSave: "Load copies a named save into autosave; subsequent edits do not touch the named slot until Save.",
    },
  };
  const webSnapshot = {
    schemaVersion: 1,
    adventure: adventureSave,
    explore: exploreSnapshot,
    editor: editorSnapshot,
  };
  const transport = {
    protocol: "BC5R1",
    wireFormat: "BC5R1:<base64url(deflate(UTF-8 JSON(MapDocument)))>",
    decodedPayload: "MapDocument",
    exampleDecodedPayload: mapDocument,
  };

  const entityContract = {
    schemaVersion: 1,
    reservedFields: [...LEVEL_ENTITY_RESERVED_FIELDS],
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map((definition) => [definition.type, contractView(definition)]),
    ),
    migrationAliases: ENTITY_MAP_MIGRATION_ALIASES,
    unresolvedSources: ENTITY_MAP_UNRESOLVED_SOURCES,
  };
  const entityExamples = {
    schemaVersion: 1,
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map((definition) => [definition.type, examplesForDefinition(definition)]),
    ),
  };

  const schemaIndex = {
    schemaVersion: 1,
    schemas: [
      item("entity-map", "@bobby/model", "model/src/entity-map.ts", "entity-map-contract.json", "review/entity-map.jsonc"),
      item("level-entity", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("win-condition", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("level-limit-rules", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("map-music", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("level-map", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("map-document", "@bobby/model", "model/src/types.ts", "examples/map-document.json", "review/map-document.jsonc"),
      item("collection-manifest", "@bobby/model", "model/src/collection.ts", "examples/collections-manifest.json", "review/collections-manifest.jsonc"),
      item("map-collections-index", "@bobby/model", "model/src/collection.ts", "examples/map-collections-index.json", "review/map-collections-index.jsonc"),
      item("map-collection-index", "@bobby/model", "model/src/collection.ts", "examples/map-collection-index.json", "review/map-collection-index.jsonc"),
      item("adventure-save", "@bobby/adventure", "adventure/src/save.ts", "examples/adventure-save.json", "review/adventure-save.jsonc"),
      item("storage-keys", "web", "web/src/storage/contracts.ts", "examples/storage-contract.json", "review/storage-keys.jsonc"),
      item("explore-storage", "web", "web/src/storage/contracts.ts", "examples/explore-collection-storage.json", "review/storage-keys.jsonc"),
      item("editor-storage", "web", "web/src/storage/contracts.ts", "examples/editor-storage.json", "review/storage-keys.jsonc"),
      item("web-storage-snapshot", "web", "web/src/storage/contracts.ts", "examples/web-storage-snapshot.json", "review/storage-keys.jsonc"),
      { id: "bc5r1-map-transport", owner: "editor/share", source: "transport around MapDocument", kind: "transport", example: "examples/bc5r1-transport.json" },
    ],
  };

  writeJson(path.join(outputDir, "schema-index.json"), schemaIndex);
  writeJson(path.join(outputDir, "entity-map-contract.json"), entityContract);
  writeJson(path.join(outputDir, "entity-map-examples.json"), entityExamples);

  const examples = {
    "level-map.json": levelMap,
    "map-document.json": mapDocument,
    "collections-manifest.json": manifest,
    "map-collections-index.json": collectionsIndex,
    "map-collection-index.json": collectionIndex,
    "adventure-save.json": adventureSave,
    "storage-contract.json": storageContract,
    "explore-collection-storage.json": exploreCollection,
    "explore-storage.json": exploreSnapshot,
    "editor-storage.json": editorSnapshot,
    "web-storage-snapshot.json": webSnapshot,
    "bc5r1-transport.json": transport,
  };
  for (const [name, value] of Object.entries(examples)) writeJson(path.join(examplesDir, name), value);

  writeText(path.join(reviewDir, "entity-map.jsonc"), entityReview());
  writeText(path.join(reviewDir, "entity-migration.jsonc"), entityMigrationReview());
  writeText(path.join(reviewDir, "map-document.jsonc"), mapDocumentReview(mapDocument));
  writeText(path.join(reviewDir, "collections-manifest.jsonc"), `// Hand-maintained custom-maps/collections.json.\n// No maps/filters/visible/order. Array order is collection order; filesystem defines membership.\n${JSON.stringify(manifest, null, 2)}\n`);
  writeText(path.join(reviewDir, "map-collections-index.jsonc"), `// assets/maps/index.json. Summary id resolves assets/maps/<id>/index.json.\n${JSON.stringify(collectionsIndex, null, 2)}\n`);
  writeText(path.join(reviewDir, "map-collection-index.jsonc"), `// assets/maps/<collection>/index.json.\n// No top-level id: collection identity comes from the path. maps[].id remains the resource/map ID.\n${JSON.stringify(collectionIndex, null, 2)}\n`);
  writeText(path.join(reviewDir, "adventure-save.jsonc"), adventureReview(adventureSave));
  writeText(path.join(reviewDir, "storage-keys.jsonc"), storageReview());

  writeJson(path.join(outputDir, "examples.json"), {
    schemaVersion: 1,
    levelMap,
    mapDocument,
    collectionManifest: manifest,
    mapCollectionsIndex: collectionsIndex,
    mapCollectionIndex: collectionIndex,
    adventureSave,
    storageContract,
    exploreCollectionStorage: exploreCollection,
    exploreStorage: exploreSnapshot,
    editorStorage: editorSnapshot,
    webStorageSnapshot: webSnapshot,
    bc5r1Transport: transport,
    entityMap: entityExamples,
  });

  console.log(path.relative(root, path.join(outputDir, "schema-index.json")));
  console.log(path.relative(root, path.join(outputDir, "examples.json")));
  console.log(path.relative(root, examplesDir));
  console.log(path.relative(root, reviewDir));
}

function item(id, owner, source, example, review) {
  return { id, owner, source, kind: "json", example, review };
}

function contractView(definition) {
  return {
    ...(definition.description ? { description: definition.description } : {}),
    fields: Object.fromEntries(definition.fields.map(({ key, ...field }) => [key, field])),
  };
}

function examplesForDefinition(definition) {
  const baseline = { type: definition.type, x: 0, y: 0 };
  for (const field of definition.fields) {
    const value = baselineValue(field);
    if (value !== undefined) baseline[field.key] = value;
  }
  const values = [baseline];
  for (const field of definition.fields) {
    for (const value of reviewValues(field)) {
      if (baseline[field.key] !== value) values.push({ ...baseline, [field.key]: value });
    }
  }
  return uniqueJson(values);
}

function baselineValue(field) {
  if (field.default !== undefined) return field.default;
  if (!field.required) return undefined;
  if (field.kind === "enum") return field.values[0];
  if (field.kind === "integer" || field.kind === "number") return field.min ?? 0;
  if (field.kind === "boolean") return false;
  if (field.kind === "string") return "example";
}

function reviewValues(field) {
  if (field.kind === "enum") return field.values;
  if (field.kind === "boolean") return [false, true];
  if (field.kind === "integer" || field.kind === "number")
    return [field.default, field.min, field.max].filter((value) => value !== undefined);
  return field.default === undefined ? [] : [field.default];
}

function uniqueJson(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapDocumentExample() {
  return {
    schemaVersion: 1,
    meta: { name: "Carousel Direction Test", author: "Alice" },
    width: 8,
    height: 6,
    music: "ingame0",
    note: "验证 Carousel 与 Speed 的初始地图语义。",
    entities: [
      { type: "bobby", x: 1, y: 2 },
      { type: "speed", x: 2, y: 2, direction: "right" },
      { type: "carousel", x: 4, y: 2, direction: "left-up" },
      { type: "color-switch", x: 5, y: 2, color: "yellow" },
      { type: "exit", x: 6, y: 2 },
    ],
    rules: { win: { type: "reach", target: "exit" }, limits: [{ type: "max-moves", moves: 100 }] },
  };
}

function withoutMeta(document) {
  const { meta: _meta, ...level } = document;
  return level;
}

function collectionManifestExample() {
  return {
    schemaVersion: 1,
    collections: [
      {
        id: "original-patch",
        name: "Original Patch",
        description: "用于与原版 JAR 对比机关机制的测试地图。",
        chapters: { "37": { name: "Carousel", description: "Carousel 与相关开关验证。" } },
      },
      { id: "engine-lab", name: "Engine Lab", cardSize: "small" },
    ],
  };
}

function collectionsIndexExample() {
  return {
    schemaVersion: 1,
    collections: [
      { id: "original", name: "原版关卡", description: "Bobby Carrot 5 原版关卡。" },
      { id: "original-patch", name: "Original Patch", description: "用于与原版 JAR 对比机关机制的测试地图。" },
      { id: "engine-lab", name: "Engine Lab" },
    ],
  };
}

function collectionIndexExample() {
  return {
    schemaVersion: 1,
    name: "Original Patch",
    description: "用于与原版 JAR 对比机关机制的测试地图。",
    cardSize: "medium",
    filters: [{
      id: "mechanism",
      name: "Mechanism",
      options: [{ id: "dragon", name: "Dragon", icon: { type: "entity", entity: { type: "dragon", direction: "left" } } }],
    }],
    chapters: [{ id: "37", name: "Carousel", description: "Carousel 与相关开关验证。" }],
    maps: [
      { id: "37-1", name: "Carousel Basic", chapter: "37" },
      { id: "37-2", name: "Carousel Switch", chapter: "37" },
      { id: "37-10", name: "Carousel Combined", chapter: "37" },
    ],
  };
}

function adventureSaveExample() {
  return {
    schemaVersion: 1,
    game: "bc5r",
    campaign: {
      completedLevels: ["1-1", "1-bonus-1"],
      completedEvents: ["bonus-key-trial"],
      resumeLevelId: "1-2",
    },
    economy: { bonusCoins: 3, goldenCarrots: 1 },
    items: ["golden-key"],
  };
}

function exploreCollectionExample() {
  return { schemaVersion: 1, completedMaps: ["37-1", "37-2"], lastMap: "37-10" };
}

function entityReview() {
  const definitions = Object.values(ENTITY_MAP_DEFINITIONS);
  const lines = [
    "{",
    "  // Canonical types accepted in LevelMap.entities[]. Engine runtime/presentation identities are excluded.",
    '  "entities": {',
  ];
  definitions.forEach((definition, index) => {
    lines.push(`    ${JSON.stringify(definition.type)}: {`);
    if (definition.description) lines.push(`      // ${comment(definition.description)}`);
    if (definition.fields.length === 0) lines.push("      // No entity-specific persisted fields.");
    for (const field of definition.fields) lines.push(`      // ${comment(fieldSummary(field))}`);
    lines.push(`      "example": ${JSON.stringify(examplesForDefinition(definition)[0])}`);
    lines.push(`    }${index + 1 === definitions.length ? "" : ","}`);
  });
  lines.push("  }", "}", "");
  return lines.join("\n");
}

function entityMigrationReview() {
  return `{
  // Review/migration notes only. Final strict parser must NOT accept old aliases.
  "aliases": ${JSON.stringify(ENTITY_MAP_MIGRATION_ALIASES, null, 2)},

  // These source groups intentionally have no stable Map ABI yet.
  // Do not freeze background-variant-*, walkable-variant-*, ground-a..d, or object-variant-*.
  "unresolved": ${JSON.stringify(ENTITY_MAP_UNRESOLVED_SOURCES, null, 2)}
}
`;
}

function mapDocumentReview(value) {
  return `// MapDocument has no id/chapter/next/collection. Resource identity comes from its path.
// music: "random" | "none" | logical track ID; modern/8bit is runtime playback style.
// win.type: all | any | collect-all | fill-all | reach
// limit.type: max-moves | max-time-seconds
${JSON.stringify(value, null, 2)}
`;
}

function adventureReview(value) {
  return `// Physical localStorage key: ${STORAGE_KEYS.adventure}
// completedEvents allowed values: ${ADVENTURE_EVENT_IDS.join(" | ")}
// bonus-key-trial = Beaver bonus temporary-key trial has been used/completed.
// items allowed values: ${ADVENTURE_ITEM_IDS.join(" | ")}
${JSON.stringify(value, null, 2)}
`;
}

function storageReview() {
  return `{
  // Stable physical localStorage namespaces:
  "adventure": "${STORAGE_KEYS.adventure}",
  "explore": "${STORAGE_KEYS.explore}", // one independent payload per collection
  "editorAutosave": "${STORAGE_KEYS.editorAutosave}", // automatic working draft only
  "editorNamed": "${STORAGE_KEYS.editorNamed}" // written only by explicit Save / Save As

  // Editor workflow:
  // - New/open/import/edit => autosave only.
  // - Save / Save As => explicit named slot.
  // - Load named slot => copy into autosave; typing does not mutate named save.
  // - Refresh => recover autosave, not a writable named slot.
  // - "autosave" is reserved. Named slots are unlimited and discovered by scanning bc5r:editor/ keys.
  // - User-facing slot names are URI-encoded in the physical key suffix.
}
`;
}

function fieldSummary(field) {
  const parts = [`${field.key}: ${field.kind}`];
  if (field.kind === "enum") parts.push(`values = ${field.values.join(" | ")}`);
  if (field.required) parts.push("required");
  if (field.default !== undefined) parts.push(`default = ${JSON.stringify(field.default)}`);
  if (field.min !== undefined) parts.push(`min = ${field.min}`);
  if (field.max !== undefined) parts.push(`max = ${field.max}`);
  if (field.description) parts.push(field.description);
  return parts.join("; ");
}

function comment(value) {
  return String(value).replaceAll("\n", " ");
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value.endsWith("\n") ? value : `${value}\n`);
}
