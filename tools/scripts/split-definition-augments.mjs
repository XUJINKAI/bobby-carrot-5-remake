import fs from "node:fs";
import path from "node:path";
import { root } from "./util.mjs";

const definitionFile = path.join(root, "engine/src/mechanics/definitions.ts");
let source = fs.readFileSync(definitionFile, "utf8");

if (!source.includes('./definition-augments.js')) {
  const block = take(
    source,
    "const blockingObjects: ObjectType[] =",
    "function variantTerrainDefinition",
  );

  const body = block
    .replaceAll("objectDefinitions.get(", "ports.getObject(")
    .replaceAll("objectDef(", "ports.defineObject(")
    .replaceAll("object({", "ports.setObject({")
    .replaceAll("terrainDef(", "ports.defineTerrain(")
    .replaceAll("getTerrainDefinition(", "ports.getTerrain(")
    .trim();

  const augmentFile = [
    'import type { ObjectType, TerrainType } from "../data/types.js";',
    'import { ObjectId, Terrain, type Direction } from "./ids.js";',
    'import { markerBehavior, type TileBehavior } from "./behaviors.js";',
    'import { CLOUD_INFO } from "./mechanic-links.js";',
    'import type { TileDefinition, TileTrait } from "./definition-types.js";',
    "",
    "interface DefinitionAugmentPorts {",
    "  defineObject(",
    "    id: ObjectType,",
    "    category: string,",
    "    traits: TileTrait[],",
    "    behaviors: TileBehavior[],",
    "  ): void;",
    "  getObject(id: ObjectType): TileDefinition<ObjectType>;",
    "  setObject(definition: TileDefinition<ObjectType>): void;",
    "  defineTerrain(",
    "    id: TerrainType,",
    "    category: string,",
    "    traits: TileTrait[],",
    "    behaviors: TileBehavior[],",
    "  ): void;",
    "  getTerrain(id: TerrainType): TileDefinition<TerrainType>;",
    "}",
    "",
    "export function applyDefinitionAugments(ports: DefinitionAugmentPorts): void {",
    indent(body, 2),
    "}",
    "",
  ].join("\n");

  fs.writeFileSync(
    path.join(root, "engine/src/mechanics/definition-augments.ts"),
    augmentFile,
  );

  source = source.replace(
    '} from "./behaviors.js";\n',
    '} from "./behaviors.js";\nimport { applyDefinitionAugments } from "./definition-augments.js";\n',
  );
  source = source.replace(
    block,
    [
      "applyDefinitionAugments({",
      "  defineObject: objectDef,",
      "  getObject: getObjectDefinition,",
      "  setObject: object,",
      "  defineTerrain: terrainDef,",
      "  getTerrain: getTerrainDefinition,",
      "});",
      "",
    ].join("\n"),
  );

  fs.writeFileSync(definitionFile, source);
}

function take(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  if (start < 0 || end < 0) {
    throw new Error(`拆分标记不存在：${startMarker} -> ${endMarker}`);
  }
  return text.slice(start, end);
}

function indent(text, spaces) {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line ? `${prefix}${line}` : line))
    .join("\n");
}
