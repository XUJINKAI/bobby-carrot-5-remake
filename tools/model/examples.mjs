import fs from "node:fs";
import path from "node:path";
import {
  ADVENTURE_EVENT_IDS,
  ADVENTURE_ITEM_IDS,
} from "@bobby/adventure";
import {
  ENTITY_MAP_DEFINITIONS,
  ENTITY_MAP_MIGRATION_ALIASES,
  ENTITY_MAP_UNRESOLVED_SOURCES,
  LEVEL_ENTITY_RESERVED_FIELDS,
  entityMapDefinition,
} from "@bobby/model";
import { root } from "../lib/fs.mjs";

const requestedType = process.argv[2];

const STORAGE_KEYS = {
  adventure: "bc5r:adventure",
  explore: "bc5r:explore/<collection>",
  editorAutosave: "bc5r:editor/autosave",
  editorNamed: "bc5r:editor/<name>",
};

if (requestedType) {
  const definition = entityMapDefinition(requestedType);
  if (!definition) throw new Error(`Unknown map entity type: ${requestedType}`);
  process.stdout.write(
    `${JSON.stringify(
      {
        contract: contractView(definition),
        examples: examplesForDefinition(definition),
      },
      null,
      2,
    )}\n`,
  );
} else {
  const outputDir = path.join(root, "tmp/schema");
  const examplesDir = path.join(outputDir, "examples");
  const reviewDir = path.join(outputDir, "review");
  fs.mkdirSync(examplesDir, { recursive: true });
  fs.mkdirSync(reviewDir, { recursive: true });

  const entityContract = {
    schemaVersion: 1,
    reservedFields: [...LEVEL_ENTITY_RESERVED_FIELDS],
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map((definition) => [
        definition.type,
        contractView(definition),
      ]),
    ),
    migrationAliases: ENTITY_MAP_MIGRATION_ALIASES,
    unresolvedSources: ENTITY_MAP_UNRESOLVED_SOURCES,
  };

  const entityExamples = {
    schemaVersion: 1,
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map((definition) => [
        definition.type,
        examplesForDefinition(definition),
      ]),
    ),
  };

  const mapDocument = mapDocumentExample();
  const levelMap = levelMapExample(mapDocument);
  const collectionManifest = collectionManifestExample();
  const collectionsIndex = collectionsIndexExample();
  const collectionIndex = collectionIndexExample();
  const adventureSave = adventureSaveExample();
  const exploreCollectionStorage = exploreCollectionStorageExample();
  const exploreStorage = exploreStorageExample();
  const editorStorage = editorStorageExample(mapDocument);
  const storageContract = storageContractExample();
  const webStorageSnapshot = {
    schemaVersion: 1,
    adventure: adventureSave,
    explore: exploreStorage,
    editor: editorStorage,
  };
  const bc5r1Transport = {
    protocol: "BC5R1",
    wireFormat: "BC5R1:<base64url(deflate(UTF-8 JSON(MapDocument)))>",
    decodedPayload: "MapDocument",
    exampleDecodedPayload: mapDocument,
  };

  const schemaIndex = {
    schemaVersion: 1,
    schemas: [
      schema("entity-map", "@bobby/model", "model/src/entity-map.ts", "entity-map-contract.json", "review/entity-map.jsonc"),
      schema("level-entity", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      schema("win-condition", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      schema("level-limit-rules", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      schema("map-music", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      schema("level-map", "@bobby/model", "model/src/types.ts", "examples/level-map.json", "review/map-document.jsonc"),
      schema("map-meta-document", "@bobby/model", "model/src/types.ts", "examples/map-document.json", "review/map-document.jsonc"),
      schema("collection-ui-types", "@bobby/model", "model/src/collection.ts", "examples/map-collection-index.json", "review/map-collection-index.jsonc"),
      schema("map-collection-index", "@bobby/model", "model/src/collection.ts", "examples/map-collection-index.json", "review/map-collection-index.jsonc"),
      schema("map-collections-index", "@bobby/model", "model/src/collection.ts", "examples/map-collections-index.json", "review/map-collections-index.jsonc"),
      schema("collection-manifest", "@bobby/model", "model/src/collection.ts", "examples/collections-manifest.json", "review/collections-manifest.jsonc"),
      schema("adventure-save", "@bobby/adventure", "adventure/src/save.ts", "examples/adventure-save.json", "review/adventure-save.jsonc"),
      schema("storage-keys", "web", "web/src/storage/contracts.ts", "examples/storage-contract.json", "review/storage-keys.jsonc"),
      schema("explore-storage", "web", "web/src/storage/contracts.ts", "examples/explore-collection-storage.json", "review/storage-keys.jsonc"),
      schema("editor-storage", "web", "web/src/storage/contracts.ts", "examples/editor-storage.json", "review/storage-keys.jsonc"),
      schema("web-storage-snapshot", "web", "web/src/storage/contracts.ts", "examples/web-storage-snapshot.json", "review/storage-keys.jsonc"),
      {
        id: "bc5r1-map-transport",
        owner: "editor/share",
        source: "transport around MapDocument",
        kind: "transport",
        example: "examples/bc5r1-transport.json",
      },
    ],
  };

  writeJson(path.join(outputDir, "schema-index.json"), schemaIndex);
  writeJson(path.join(outputDir, "entity-map-contract.json"), entityContract);
  writeJson(path.join(outputDir, "entity-map-examples.json"), entityExamples);

  const exampleFiles = {
    "level-map.json": levelMap,
    "map-document.json": mapDocument,
    "collections-manifest.json": collectionManifest,
    "map-collections-index.json": collectionsIndex,
    "map-collection-index.json": collectionIndex,
    "adventure-save.json": adventureSave,
    "storage-contract.json": storageContract,
    "explore-collection-storage.json": exploreCollectionStorage,
    "explore-storage.json": exploreStorage,
    "editor-storage.json": editorStorage,
    "web-storage-snapshot.json": webStorageSnapshot,
    "bc5r1-transport.json": bc5r1Transport,
  };

  for (const [filename, value] of Object.entries(exampleFiles))
    writeJson(path.join(examplesDir, filename), value);

  writeText(path.join(reviewDir, "entity-map.jsonc"), entityReviewJsonc());
  writeText(path.join(reviewDir, "entity-migration.jsonc"), entityMigrationReviewJsonc());
  writeText(path.join(reviewDir, "map-document.jsonc"), mapDocumentReviewJsonc(mapDocument));
  writeText(path.join(reviewDir, "collections-manifest.jsonc"), collectionManifestReviewJsonc(collectionManifest));
  writeText(path.join(reviewDir, "map-collections-index.jsonc"), collectionsIndexReviewJsonc(collectionsIndex));
  writeText(path.join(reviewDir, "map-collection-index.jsonc"), collectionIndexReviewJsonc(collectionIndex));
  writeText(path.join(reviewDir, "adventure-save.jsonc"), adventureSaveReviewJsonc(adventureSave));
  writeText(path.join(reviewDir, "storage-keys.jsonc"), storageReviewJsonc());

  const allExamples = {
    schemaVersion: 1,
    levelMap,
    mapDocument,
    collectionManifest,
    mapCollectionsIndex: collectionsIndex,
    mapCollectionIndex: collectionIndex,
    adventureSave,
    storageContract,
    exploreCollectionStorage,
    exploreStorage,
    editorStorage,
    webStorageSnapshot,
    bc5r1Transport,
    entityMap: entityExamples,
  };
  writeJson(path.join(outputDir, "examples.json"), allExamples);

  console.log(path.relative(root, path.join(outputDir, "schema-index.json")));
  console.log(path.relative(root, path.join(outputDir, "examples.json")));
  console.log(path.relative(root, examplesDir));
  console.log(path.relative(root, reviewDir));
}

function schema(id, owner, source, example, review) {
  return { id, owner, source, kind: "json", example, ...(review ? { review } : {}) };
}

function contractView(definition) {
  return {
    ...(definition.description ? { description: definition.description } : {}),
    fields: fieldMap(definition.fields),
  };
}

function fieldMap(fields) {
  return Object.fromEntries(
    fields.map((field) => {
      const { key, ...contract } = field;
      return [key, contract];
    }),
  );
}

function examplesForDefinition(definition) {
  const baseline = {
    type: definition.type,
    x: 0,
    y: 0,
  };

  for (const field of definition.fields) {
    const value = baselineValue(field);
    if (value !== undefined) baseline[field.key] = value;
  }

  const examples = [baseline];
  for (const field of definition.fields) {
    for (const value of reviewValues(field)) {
      if (baseline[field.key] === value) continue;
      examples.push({ ...baseline, [field.key]: value });
    }
  }
  return dedupeExamples(examples);
}

function baselineValue(field) {
  if (field.default !== undefined) return field.default;
  if (field.required && field.kind === "enum") return field.values[0];
  if (field.required && (field.kind === "integer" || field.kind === "number"))
    return field.min ?? 0;
  if (field.required && field.kind === "boolean") return false;
  if (field.required && field.kind === "string") return "example";
  return undefined;
}

function reviewValues(field) {
  if (field.kind === "enum") return field.values;
  if (field.kind === "boolean") return [false, true];
  if (field.kind === "integer" || field.kind === "number") {
    const values = [];
    if (field.default !== undefined) values.push(field.default);
    if (field.min !== undefined) values.push(field.min);
    if (field.max !== undefined) values.push(field.max);
    return values;
  }
  return field.default !== undefined ? [field.default] : [];
}

function dedupeExamples(examples) {
  const seen = new Set();
  return examples.filter((example) => {
    const key = JSON.stringify(example);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapDocumentExample() {
  return {
    schemaVersion: 1,
    meta: {
      name: "Carousel Direction Test",
      author: "Alice",
    },
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
    rules: {
      win: { type: "reach", target: "exit" },
      limits: [{ type: "max-moves", moves: 100 }],
    },
  };
}

function levelMapExample(document) {
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
        chapters: {
          "37": {
            name: "Carousel",
            description: "Carousel 与相关开关验证。",
          },
        },
      },
      {
        id: "engine-lab",
        name: "Engine Lab",
        cardSize: "small",
      },
    ],
  };
}

function collectionsIndexExample() {
  return {
    schemaVersion: 1,
    collections: [
      {
        id: "original",
        name: "原版关卡",
        description: "Bobby Carrot 5 原版关卡。",
      },
      {
        id: "original-patch",
        name: "Original Patch",
        description: "用于与原版 JAR 对比机关机制的测试地图。",
      },
      {
        id: "engine-lab",
        name: "Engine Lab",
      },
    ],
  };
}

function collectionIndexExample() {
  return {
    schemaVersion: 1,
    name: "Original Patch",
    description: "用于与原版 JAR 对比机关机制的测试地图。",
    cardSize: "medium",
    filters: [
      {
        id: "mechanism",
        name: "Mechanism",
        options: [
          {
            id: "dragon",
            name: "Dragon",
            icon: {
              type: "entity",
              entity: { type: "dragon", direction: "left" },
            },
          },
        ],
      },
    ],
    chapters: [
      {
        id: "37",
        name: "Carousel",
        description: "Carousel 与相关开关验证。",
      },
    ],
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
    economy: {
      bonusCoins: 3,
      goldenCarrots: 1,
    },
    items: ["golden-key"],
  };
}

function storageContractExample() {
  return {
    keys: STORAGE_KEYS,
    editorPolicy: {
      autosave: "Editing writes only bc5r:editor/autosave.",
      namedSave: "Save / Save As explicitly writes bc5r:editor/<name>.",
      loadNamedSave: "Load copies the named save into the working autosave; edits do not mutate the named slot until Save.",
    },
  };
}

function exploreCollectionStorageExample() {
  return {
    schemaVersion: 1,
    completedMaps: ["37-1", "37-2"],
    lastMap: "37-10",
  };
}

function exploreStorageExample() {
  return {
    original: {
      schemaVersion: 1,
      completedMaps: ["1-1", "1-2"],
      lastMap: "1-3",
    },
    "original-patch": exploreCollectionStorageExample(),
  };
}

function editorStorageExample(mapDocument) {
  return {
    autosave: mapDocument,
    saves: {
      "carousel-lab": {
        ...mapDocument,
        meta: { ...mapDocument.meta, name: "Carousel Lab Saved Copy" },
      },
    },
  };
}

function entityReviewJsonc() {
  const lines = [
    "{",
    "  // Canonical types accepted in LevelMap.entities[]. Runtime/presentation identities are excluded.",
    '  "entities": {',
  ];
  const definitions = Object.values(ENTITY_MAP_DEFINITIONS);
  definitions.forEach((definition, index) => {
    lines.push(`    ${JSON.stringify(definition.type)}: {`);
    if (definition.description)
      lines.push(`      // ${sanitizeComment(definition.description)}`);
    if (definition.fields.length === 0) {
      lines.push("      // No entity-specific persisted fields.");
    } else {
      for (const field of definition.fields)
        lines.push(`      // ${sanitizeComment(fieldSummary(field))}`);
    }
    lines.push(`      "example": ${indentJson(examplesForDefinition(definition)[0], 6).trimStart()}`);
    lines.push(`    }${index === definitions.length - 1 ? "" : ","}`);
  });
  lines.push("  }", "}", "");
  return lines.join("\n");
}

function entityMigrationReviewJsonc() {
  return `{
  // These are migration/review notes only. The final strict parser should NOT accept old aliases.
  "aliases": ${indentJson(ENTITY_MAP_MIGRATION_ALIASES, 2).trimStart()},

  // These source groups intentionally have no stable Map ABI yet.
  // Do not freeze background-variant-*, walkable-variant-*, ground-a..d, or object-variant-* names.
  "unresolved": ${indentJson(ENTITY_MAP_UNRESOLVED_SOURCES, 2).trimStart()}
}
`;
}

function mapDocumentReviewJsonc(document) {
  const json = JSON.stringify(document, null, 2)
    .replace('"music": "ingame0",', '// music: "random" | "none" | logical track ID. Style (modern/8bit) is runtime config.\n  "music": "ingame0",')
    .replace('"win": {', '// win.type: all | any | collect-all | fill-all | reach\n    "win": {')
    .replace('"limits": [', '// limit.type: max-moves | max-time-seconds\n    "limits": [');
  return `// MapDocument has no id/chapter/next/collection fields; resource identity comes from its path.\n${json}\n`;
}

function collectionManifestReviewJsonc(value) {
  return `// Hand-maintained custom-maps/collections.json.\n// No maps, filters, visible, or order fields. Array order is collection order; filesystem defines membership.\n${JSON.stringify(value, null, 2)}\n`;
}

function collectionsIndexReviewJsonc(value) {
  return `// assets/maps/index.json. Summary id is required because it resolves assets/maps/<id>/index.json.\n${JSON.stringify(value, null, 2)}\n`;
}

function collectionIndexReviewJsonc(value) {
  return `// assets/maps/<collection>/index.json.\n// There is deliberately NO top-level id: collection identity already comes from the resource path.\n// maps[].id remains required because it resolves the map filename/path.\n${JSON.stringify(value, null, 2)}\n`;
}

function adventureSaveReviewJsonc(value) {
  const eventList = ADVENTURE_EVENT_IDS.map((id) => `"${id}"`).join(" | ");
  const itemList = ADVENTURE_ITEM_IDS.map((id) => `"${id}"`).join(" | ");
  const json = JSON.stringify(value, null, 2)
    .replace('"completedEvents": [', `// allowed completedEvents: ${eventList}\n    // bonus-key-trial: Beaver bonus temporary-key trial has been used/completed.\n    "completedEvents": [`)
    .replace('"items": [', `// allowed items: ${itemList}\n  "items": [`);
  return `// Physical localStorage key: ${STORAGE_KEYS.adventure}\n${json}\n`;
}

function storageReviewJsonc() {
  return `{
  // These physical localStorage namespaces are part of the stable Web persistence contract.
  "adventure": "${STORAGE_KEYS.adventure}",
  "explore": "${STORAGE_KEYS.explore}", // one independent record per collection
  "editorAutosave": "${STORAGE_KEYS.editorAutosave}", // overwritten automatically while editing
  "editorNamed": "${STORAGE_KEYS.editorNamed}" // written ONLY by explicit Save / Save As

  // Editor workflow:
  // 1. Opening/new/importing a document creates/updates autosave.
  // 2. Typing only updates autosave.
  // 3. Save / Save As writes a named key.
  // 4. Loading a named key copies it to autosave; it does not make subsequent typing overwrite the named key.
  // 5. "autosave" is a reserved slot name. Named slots are unlimited; enumerate keys by the bc5r:editor/ prefix.
  // 6. User-facing names are URI-encoded in the physical key suffix.
}
`;
}

function fieldSummary(field) {
  const pieces = [`${field.key}: ${field.kind}`];
  if (field.kind === "enum") pieces.push(`values = ${field.values.map(String).join(" | ")}`);
  if (field.required) pieces.push("required");
  if (field.default !== undefined) pieces.push(`default = ${JSON.stringify(field.default)}`);
  if (field.min !== undefined) pieces.push(`min = ${field.min}`);
  if (field.max !== undefined) pieces.push(`max = ${field.max}`);
  if (field.description) pieces.push(field.description);
  return pieces.join("; ");
}

function sanitizeComment(value) {
  return String(value).replaceAll("\n", " ");
}

function indentJson(value, spaces) {
  const indent = " ".repeat(spaces);
  return JSON.stringify(value, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : indent + line))
    .join("\n");
}

function writeJson(filepath, value) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filepath, value) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, value.endsWith("\n") ? value : `${value}\n`);
}
