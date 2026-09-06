import fs from "node:fs";
import path from "node:path";
import {
  ENTITY_MAP_DEFINITIONS,
  ENTITY_MAP_INDEXED_FAMILIES,
  LEVEL_ENTITY_RESERVED_FIELDS,
  entityMapDefinition,
} from "@bobby/model";
import { root } from "../lib/fs.mjs";

const requestedType = process.argv[2];

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
  fs.mkdirSync(examplesDir, { recursive: true });

  const entityContract = {
    schemaVersion: 1,
    reservedFields: [...LEVEL_ENTITY_RESERVED_FIELDS],
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map((definition) => [
        definition.type,
        contractView(definition),
      ]),
    ),
    indexedFamilies: ENTITY_MAP_INDEXED_FAMILIES.map((family) => ({
      pattern: indexedFamilyPattern(family),
      min: family.min,
      max: family.max,
      fields: fieldMap(family.fields),
    })),
  };

  const entityExamples = {
    schemaVersion: 1,
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map((definition) => [
        definition.type,
        examplesForDefinition(definition),
      ]),
    ),
    indexedFamilies: ENTITY_MAP_INDEXED_FAMILIES.map((family) => {
      const sampleType = `${family.prefix}${String(family.min).padStart(
        family.digits,
        "0",
      )}`;
      const definition = entityMapDefinition(sampleType);
      if (!definition)
        throw new Error(`Failed to resolve indexed entity family: ${sampleType}`);
      return {
        pattern: indexedFamilyPattern(family),
        sampleType,
        examples: examplesForDefinition(definition),
      };
    }),
  };

  const mapDocument = mapDocumentExample();
  const levelMap = levelMapExample(mapDocument);
  const collectionManifest = collectionManifestExample();
  const collectionsIndex = collectionsIndexExample();
  const collectionIndex = collectionIndexExample();
  const adventureSave = adventureSaveExample();
  const exploreCollectionStorage = exploreCollectionStorageExample();
  const exploreStorage = exploreStorageExample();
  const editorStorage = { draft: mapDocument };
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
      schema("entity-map", "@bobby/model", "model/src/entity-map.ts", "entity-map-contract.json"),
      schema("level-entity", "@bobby/model", "model/src/types.ts", "level-map.json"),
      schema("win-condition", "@bobby/model", "model/src/types.ts", "level-map.json"),
      schema("level-limit-rules", "@bobby/model", "model/src/types.ts", "level-map.json"),
      schema("map-music", "@bobby/model", "model/src/types.ts", "level-map.json"),
      schema("level-map", "@bobby/model", "model/src/types.ts", "level-map.json"),
      schema("map-meta-document", "@bobby/model", "model/src/types.ts", "map-document.json"),
      schema("collection-ui-types", "@bobby/model", "model/src/collection.ts", "map-collection-index.json"),
      schema("map-collection-index", "@bobby/model", "model/src/collection.ts", "map-collection-index.json"),
      schema("map-collections-index", "@bobby/model", "model/src/collection.ts", "map-collections-index.json"),
      schema("collection-manifest", "@bobby/model", "model/src/collection.ts", "collections-manifest.json"),
      schema("adventure-save", "@bobby/adventure", "adventure/src/save.ts", "adventure-save.json"),
      schema("web-storage", "web", "web/src/storage/contracts.ts", "web-storage-snapshot.json"),
      {
        id: "bc5r1-map-transport",
        owner: "editor/share",
        source: "transport around MapDocument",
        kind: "transport",
        example: "bc5r1-transport.json",
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
    "explore-collection-storage.json": exploreCollectionStorage,
    "explore-storage.json": exploreStorage,
    "editor-storage.json": editorStorage,
    "web-storage-snapshot.json": webStorageSnapshot,
    "bc5r1-transport.json": bc5r1Transport,
  };

  for (const [filename, value] of Object.entries(exampleFiles))
    writeJson(path.join(examplesDir, filename), value);

  const allExamples = {
    schemaVersion: 1,
    levelMap,
    mapDocument,
    collectionManifest,
    mapCollectionsIndex: collectionsIndex,
    mapCollectionIndex: collectionIndex,
    adventureSave,
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
}

function schema(id, owner, source, example) {
  return { id, owner, source, kind: "json", example };
}

function contractView(definition) {
  return { fields: fieldMap(definition.fields) };
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
    if (field.default !== undefined) baseline[field.key] = field.default;
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

function indexedFamilyPattern(family) {
  return `${family.prefix}${"N".repeat(family.digits)}`;
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
      { type: "bobby", x: 1, y: 2, direction: "right" },
      { type: "speed", x: 2, y: 2, direction: "right" },
      { type: "carousel", x: 4, y: 2, variant: 1 },
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
    id: "original-patch",
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
      completedEvents: ["campaign-intro"],
      resumeLevelId: "1-2",
    },
    economy: {
      bonusCoins: 3,
      goldenCarrots: 1,
    },
    items: ["golden-key"],
  };
}

function exploreCollectionStorageExample() {
  return {
    completedMaps: ["37-1", "37-2"],
    lastMap: "37-10",
  };
}

function exploreStorageExample() {
  return {
    original: {
      completedMaps: ["1-1", "1-2"],
      lastMap: "1-3",
    },
    "original-patch": exploreCollectionStorageExample(),
  };
}

function writeJson(filepath, value) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, `${JSON.stringify(value, null, 2)}\n`);
}
