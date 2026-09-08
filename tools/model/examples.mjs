import fs from "node:fs";
import path from "node:path";
import { normalizeAdventureSave } from "@bobby/adventure";
import {
  BC5R_GAME_ID,
  ENTITY_MAP_DEFINITIONS,
  entityMapDefinition,
  parseMapDocument,
} from "@bobby/model";
import { root } from "../lib/fs.mjs";

const STORAGE_KEYS = {
  setting: "bc5r:setting",
  adventure: "bc5r:adventure",
  explore: "bc5r:explore/<collection>",
  editorAutosave: "bc5r:editor/autosave",
  editorNamed: "bc5r:editor/<name>",
};

const requestedType = process.argv[2];
if (requestedType) {
  const definition = entityMapDefinition(requestedType);
  if (!definition) throw new Error(`未知 Map Entity type：${requestedType}`);
  process.stdout.write(`${JSON.stringify(entityExample(definition), null, 2)}\n`);
} else {
  generateAll();
}

function generateAll() {
  const outputDirectory = path.join(root, "tmp/schema");
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });

  const mapDocument = mapDocumentExample();
  const files = {
    "map.json": mapExamples(mapDocument),
    "entities.json": entityExamples(),
    "collections.json": collectionExamples(),
    "storage.json": storageExamples(mapDocument),
  };
  for (const [name, value] of Object.entries(files))
    writeJson(path.join(outputDirectory, name), value);

  writeJson(path.join(outputDirectory, "index.json"), {
    files: Object.keys(files),
  });
  for (const name of ["index.json", ...Object.keys(files)])
    console.log(path.relative(root, path.join(outputDirectory, name)));
}

function mapExamples(document) {
  const { meta: _meta, ...level } = document;
  return {
    levelMap: level,
    mapDocument: document,
  };
}

function mapDocumentExample() {
  return parseMapDocument({
    schemaVersion: 1,
    meta: { name: "Carousel Direction Test", author: "Alice" },
    music: "ingame0",
    note: "验证 Carousel 与 Speed 的初始地图语义。",
    rules: {
      win: { type: "reach", target: "exit" },
      limits: [{ type: "max-moves", moves: 100 }],
    },
    width: 8,
    height: 6,
    entities: [
      { type: "bobby", x: 1, y: 2 },
      { type: "grass", x: 0, y: 0, variant: "ts-7-1" },
      { type: "speed", x: 2, y: 2, direction: "right" },
      { type: "carousel", x: 4, y: 2, variant: "left-top" },
      {
        type: "color-switch",
        x: 5,
        y: 2,
        color: "yellow",
        state: "state-1",
      },
      { type: "exit", x: 6, y: 2 },
    ],
  });
}

function entityExamples() {
  return {
    schemaVersion: 1,
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map(
        (definition) => [definition.type, entityExample(definition)],
      ),
    ),
  };
}

function entityExample(definition) {
  return {
    example: exampleForDefinition(definition),
    ...(definition.fields.length > 0
      ? {
          fields: Object.fromEntries(
            definition.fields.map((field) => [field.key, fieldExample(field)]),
          ),
        }
      : {}),
  };
}

function exampleForDefinition(definition) {
  const example = { type: definition.type, x: 0, y: 0 };
  for (const field of definition.fields) {
    const value = exampleFieldValue(field);
    if (value !== undefined) example[field.key] = value;
  }
  return example;
}

function fieldExample(field) {
  return {
    kind: field.kind,
    ...(field.kind === "enum" ? { variants: field.values } : {}),
    ...(field.required ? { required: true } : {}),
    ...(field.default !== undefined ? { default: field.default } : {}),
    ...(field.min !== undefined ? { min: field.min } : {}),
    ...(field.max !== undefined ? { max: field.max } : {}),
  };
}

function exampleFieldValue(field) {
  if (field.default !== undefined) return field.default;
  if (!field.required) return undefined;
  if (field.kind === "enum") return field.values[0];
  if (field.kind === "integer" || field.kind === "number")
    return field.min ?? 0;
  if (field.kind === "boolean") return false;
  if (field.kind === "string") return "example";
  return undefined;
}

function collectionExamples() {
  return {
    manifest: {
      schemaVersion: 1,
      collections: [
        {
          id: "original-patch",
          name: "Original Patch",
          description: "用于与原版 JAR 对比机关机制的测试地图。",
          cardSize: "medium",
          visible: "dev",
          chapters: {
            "37": {
              name: "Carousel",
              description: "Carousel 与相关开关验证。",
            },
          },
        },
      ],
    },
    collectionsIndex: {
      schemaVersion: 1,
      collections: [
        {
          id: "original-patch",
          name: "Original Patch",
          description: "用于与原版 JAR 对比机关机制的测试地图。",
        },
      ],
    },
    collectionIndex: {
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
      ],
    },
  };
}

function storageExamples(mapDocument) {
  return {
    game: BC5R_GAME_ID,
    records: [
      {
        key: STORAGE_KEYS.setting,
        value: {
          schemaVersion: 1,
          locale: "zh-CN",
          theme: "bobby",
          audio: {
            musicEnabled: true,
            musicMode: "follow-theme",
            volume: 100,
          },
          controls: { screenControlEnabled: true },
          editor: { paletteSize: 48 },
        },
      },
      {
        key: STORAGE_KEYS.adventure,
        value: adventureSaveExample(),
      },
      {
        key: STORAGE_KEYS.explore,
        exampleKey: "bc5r:explore/original",
        value: {
          game: BC5R_GAME_ID,
          schemaVersion: 1,
          completedMaps: ["1-1", "1-2"],
          lastMap: "1-3",
        },
      },
      {
        key: STORAGE_KEYS.editorAutosave,
        value: mapDocument,
      },
      {
        key: STORAGE_KEYS.editorNamed,
        exampleKey: "bc5r:editor/carousel-lab",
        value: {
          ...mapDocument,
          meta: { ...mapDocument.meta, name: "Carousel Lab Saved Copy" },
        },
      },
    ],
  };
}

function adventureSaveExample() {
  return normalizeAdventureSave({
    schemaVersion: 1,
    game: BC5R_GAME_ID,
    campaign: {
      completedThrough: { "1": "1-bonus-1" },
      completedEvents: ["bonus-key-trial"],
      resumeLevelId: "1-4",
    },
    economy: { bonusCoins: 3, goldenCarrots: 1 },
    items: ["golden-key"],
  });
}

function writeJson(filepath, value) {
  fs.writeFileSync(filepath, `${JSON.stringify(value, null, 2)}\n`);
}
