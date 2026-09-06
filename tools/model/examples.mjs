import fs from "node:fs";
import path from "node:path";
import {
  BC5R_GAME_ID,
  ENTITY_MAP_DEFINITIONS,
  ENTITY_MAP_MIGRATION_ALIASES,
  ENTITY_MAP_UNRESOLVED_SOURCES,
  LEVEL_ENTITY_RESERVED_FIELDS,
  SURFACE_SOURCE_MAPPINGS,
  entityMapDefinition,
  legacyEntityMapAlias,
  tsLabel,
} from "@bobby/model";
import { root } from "../lib/fs.mjs";

// Review mirror of adventure/src/save.ts. The schema-only command intentionally builds @bobby/model only;
// Adventure still contains old LevelEntity consumers that will be migrated in the implementation phase.
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
    original: {
      game: BC5R_GAME_ID,
      schemaVersion: 1,
      completedMaps: ["1-1", "1-2"],
      lastMap: "1-3",
    },
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
    game: BC5R_GAME_ID,
    keys: STORAGE_KEYS,
    editorPolicy: {
      autosave: "Typing/editing only overwrites bc5r:editor/autosave.",
      namedSave: "Save / Save As explicitly writes bc5r:editor/<name>.",
      loadNamedSave: "Load copies a named save into autosave; edits do not touch the named slot until Save.",
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
  const surfaceMappings = SURFACE_SOURCE_MAPPINGS.map(surfaceMappingView);

  const schemaIndex = {
    schemaVersion: 1,
    schemas: [
      item("game-id", "@bobby/model", "model/src/shared/game.ts", "examples/storage-contract.json", "review/storage-keys.jsonc"),
      item("entity-map", "@bobby/model", "model/src/map/entity/catalog.ts", "entity-map-contract.json", "review/entity-map.jsonc"),
      item("surface-map", "@bobby/model", "model/src/map/entity/surface.ts", "surface-map.json", "review/surface-map.jsonc"),
      item("entity-migration", "@bobby/model", "model/src/map/entity/migration.ts", "entity-map-contract.json", "review/entity-migration.jsonc"),
      item("level-entity", "@bobby/model", "model/src/map/document.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("win-condition", "@bobby/model", "model/src/map/rules.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("level-limit-rules", "@bobby/model", "model/src/map/rules.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("map-music", "@bobby/model", "model/src/map/document.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("level-map", "@bobby/model", "model/src/map/document.ts", "examples/level-map.json", "review/map-document.jsonc"),
      item("map-document", "@bobby/model", "model/src/map/document.ts", "examples/map-document.json", "review/map-document.jsonc"),
      item("collection-manifest", "@bobby/model", "model/src/collection/types.ts", "examples/collections-manifest.json", "review/collections-manifest.jsonc"),
      item("map-collections-index", "@bobby/model", "model/src/collection/types.ts", "examples/map-collections-index.json", "review/map-collections-index.jsonc"),
      item("map-collection-index", "@bobby/model", "model/src/collection/types.ts", "examples/map-collection-index.json", "review/map-collection-index.jsonc"),
      item("adventure-save", "@bobby/adventure", "adventure/src/save.ts", "examples/adventure-save.json", "review/adventure-save.jsonc"),
      item("storage-keys", "web", "web/src/storage/contracts.ts", "examples/storage-contract.json", "review/storage-keys.jsonc"),
      item("explore-storage", "web", "web/src/storage/exploreProgressStorage.ts", "examples/explore-collection-storage.json", "review/storage-keys.jsonc"),
      item("editor-storage", "web", "web/src/storage/contracts.ts", "examples/editor-storage.json", "review/storage-keys.jsonc"),
      { id: "bc5r1-map-transport", owner: "editor/share", source: "transport around MapDocument", kind: "transport", example: "examples/bc5r1-transport.json" },
    ],
  };

  writeJson(path.join(outputDir, "schema-index.json"), schemaIndex);
  writeJson(path.join(outputDir, "entity-map-contract.json"), entityContract);
  writeJson(path.join(outputDir, "entity-map-examples.json"), entityExamples);
  writeJson(path.join(outputDir, "surface-map.json"), { schemaVersion: 1, mappings: surfaceMappings });

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
  writeText(path.join(reviewDir, "surface-map.jsonc"), surfaceReview());
  writeText(path.join(reviewDir, "map-document.jsonc"), mapDocumentReview(mapDocument));
  writeText(path.join(reviewDir, "collections-manifest.jsonc"), `// Hand-maintained custom-maps/collections.json.\n// No maps/filters/order. Array order is collection order; filesystem defines membership.\n${JSON.stringify(manifest, null, 2)}\n`);
  writeText(path.join(reviewDir, "map-collections-index.jsonc"), `// assets/maps/index.json. Summary id resolves assets/maps/<id>/index.json.\n${JSON.stringify(collectionsIndex, null, 2)}\n`);
  writeText(path.join(reviewDir, "map-collection-index.jsonc"), `// assets/maps/<collection>/index.json.\n// No top-level id: collection identity comes from the path. maps[].id remains the map resource ID.\n${JSON.stringify(collectionIndex, null, 2)}\n`);
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
    surfaceMap: surfaceMappings,
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
      { type: "grass", x: 0, y: 0, variant: "ts-7-1" },
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
    game: BC5R_GAME_ID,
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
  return {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    completedMaps: ["37-1", "37-2"],
    lastMap: "37-10",
  };
}

function entityReview() {
  const lines = [
    "{",
    "  // Canonical types accepted in LevelMap.entities[]. Engine runtime/presentation identities are excluded.",
    '  "entities": {',
  ];
  const definitions = Object.values(ENTITY_MAP_DEFINITIONS);
  definitions.forEach((definition, index) => {
    lines.push(`    ${JSON.stringify(definition.type)}: {`);
    if (definition.description) lines.push(`      // ${comment(definition.description)}`);
    if (definition.fields.length === 0) lines.push("      // No entity-specific persisted fields.");
    definition.fields.forEach((field, fieldIndex) => {
      lines.push(`      // ${comment(fieldSummary(field))}`);
      lines.push(`      ${JSON.stringify(field.key)}: ${JSON.stringify(baselineValue(field))}${fieldIndex === definition.fields.length - 1 ? "" : ","}`);
    });
    lines.push(`    }${index === definitions.length - 1 ? "" : ","}`);
  });
  lines.push("  }", "}");
  return `${lines.join("\n")}\n`;
}

function fieldSummary(field) {
  const pieces = [field.kind];
  if (field.kind === "enum") pieces.push(`values = ${field.values.join(" | ")}`);
  if (field.min !== undefined || field.max !== undefined) pieces.push(`range = ${field.min ?? "-∞"}..${field.max ?? "+∞"}`);
  if (field.default !== undefined) pieces.push(`default = ${JSON.stringify(field.default)}`);
  if (field.required) pieces.push("required");
  if (field.description) pieces.push(field.description);
  return pieces.join("; ");
}

function entityMigrationReview() {
  const dynamicExamples = [
    "background-variant-001",
    "background-variant-086",
    "background-variant-092",
    "background-variant-096",
    "walkable-variant-01",
    "walkable-variant-10",
  ].map((type) => legacyEntityMapAlias(type)).filter(Boolean);
  const value = {
    staticAliases: ENTITY_MAP_MIGRATION_ALIASES,
    dynamicRawExamples: dynamicExamples,
    unresolved: ENTITY_MAP_UNRESOLVED_SOURCES,
  };
  return `// Review-only migration guide. These aliases are NOT accepted by the final strict Map parser.\n// background-variant-* / walkable-variant-* are resolved from their original ts(row,column) coordinates.\n${JSON.stringify(value, null, 2)}\n`;
}

function surfaceMappingView(mapping) {
  return {
    source: mapping.sources.map(tsLabel),
    type: mapping.type,
    ...(mapping.fields ? { fields: mapping.fields } : {}),
    ...(mapping.composite ? { composite: true } : {}),
    ...(mapping.note ? { note: mapping.note } : {}),
  };
}

function surfaceReview() {
  const lines = [
    "[",
    "  // First-pass semantic mapping based on docs/system/original/surface.md.",
    "  // Coordinates follow docs/system/original/README.md: ts(row,column), 1-based.",
    "  // Visual-only variants use ts-row-column; semantically meaningful variants keep semantic names.",
    "  // Unknown tiles intentionally use surface-<row>-<column> instead of a guessed semantic name.",
  ];
  SURFACE_SOURCE_MAPPINGS.forEach((mapping, index) => {
    const view = surfaceMappingView(mapping);
    const rendered = JSON.stringify(view, null, 2).split("\n").map((line) => `  ${line}`);
    rendered[rendered.length - 1] += index === SURFACE_SOURCE_MAPPINGS.length - 1 ? "" : ",";
    lines.push(...rendered);
  });
  lines.push("]");
  return `${lines.join("\n")}\n`;
}

function mapDocumentReview(document) {
  return `// MapDocument = playable LevelMap + deliberately narrow human metadata.\n// Resource id/chapter/collection/next/filter do not belong here.\n// music is a logical track id only; modern/8bit remains runtime audio style.\n${JSON.stringify(document, null, 2)}\n`;
}

function adventureReview(save) {
  return `// Physical key: ${STORAGE_KEYS.adventure}\n// game is a stable project provenance/source marker.\n// completedEvents enum: ${ADVENTURE_EVENT_IDS.join(" | ")}\n// items enum: ${ADVENTURE_ITEM_IDS.join(" | ")}\n${JSON.stringify(save, null, 2)}\n`;
}

function storageReview() {
  const example = {
    adventure: adventureSaveExample(),
    exploreCollection: exploreCollectionExample(),
    editor: {
      autosave: "MapDocument at bc5r:editor/autosave",
      named: "MapDocument at bc5r:editor/<name>",
    },
  };
  return `// Physical localStorage contract.\n// ${STORAGE_KEYS.adventure} -> AdventureSave\n// ${STORAGE_KEYS.explore} -> one independent ExploreCollectionStorage per collection\n// ${STORAGE_KEYS.editorAutosave} -> working MapDocument; editing may overwrite this\n// ${STORAGE_KEYS.editorNamed} -> explicit Save / Save As only\n// Adventure and Explore saves carry game = ${BC5R_GAME_ID}\n${JSON.stringify(example, null, 2)}\n`;
}

function comment(value) {
  return String(value).replaceAll("\n", " ");
}

function writeJson(filepath, value) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filepath, value) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, value.endsWith("\n") ? value : `${value}\n`);
}
