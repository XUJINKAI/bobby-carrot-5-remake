import fs from "node:fs";
import path from "node:path";
import { root } from "./util.mjs";

splitMechanicDefinitions();
splitWorldTypes();
splitGameStyles();

function splitMechanicDefinitions() {
  const file = path.join(root, "engine/src/mechanics/definitions.ts");
  let source = fs.readFileSync(file, "utf8");

  if (source.includes("./definition-types.js")) return;

  const typeBlock = take(
    source,
    "export type TileTrait =",
    "const terrainDefinitions",
  );
  const semanticsBlock = take(
    source,
    "const HIDDEN_AUTHORING_OBJECTS",
    "function terrain(",
  );
  const transformsBlock = take(
    source,
    "function toggleSpeed",
    "function defineCarousel",
  );
  const cloudInfoBlock = take(
    source,
    "const cloudInfo: Array<[ObjectType, ObjectType]> =",
    "for (const [id] of cloudInfo)",
  );
  const linksBlock = take(
    source,
    "const TIDE_DIRECTION",
    "export function reflectFireForTerrain",
  );

  const typeFile = [
    'import type { BehaviorDescription, TileBehavior } from "./behaviors.js";',
    "",
    typeBlock.trim(),
    "",
  ].join("\n");
  fs.writeFileSync(
    path.join(root, "engine/src/mechanics/definition-types.ts"),
    typeFile,
  );

  const semanticsFile = [
    'import type { ObjectType, TerrainType } from "../data/types.js";',
    'import { ObjectId, Terrain } from "./ids.js";',
    'import type { TileTrait } from "./definition-types.js";',
    "",
    semanticsBlock
      .replace(
        "const HIDDEN_AUTHORING_OBJECTS",
        "export const HIDDEN_AUTHORING_OBJECTS",
      )
      .replace("const DYNAMIC_IDS", "export const DYNAMIC_IDS")
      .replace("function pretty", "export function pretty")
      .replace("function isWaterSemantic", "export function isWaterSemantic")
      .replace(
        "function isWalkableSemantic",
        "export function isWalkableSemantic",
      )
      .replace(
        "function environmentTraits",
        "export function environmentTraits",
      )
      .trim(),
    "",
  ].join("\n");
  fs.writeFileSync(
    path.join(root, "engine/src/mechanics/definition-semantics.ts"),
    semanticsFile,
  );

  const transformsFile = [
    'import type { TerrainType } from "../data/types.js";',
    'import { Terrain } from "./ids.js";',
    "",
    transformsBlock
      .replace("function toggleSpeed", "export function toggleSpeed")
      .replace("function toggleTide", "export function toggleTide")
      .replace("function toggleColor", "export function toggleColor")
      .replace("const CAROUSEL_NEXT", "export const CAROUSEL_NEXT")
      .replace("function rotateCarousel", "export function rotateCarousel")
      .trim(),
    "",
  ].join("\n");
  fs.writeFileSync(
    path.join(root, "engine/src/mechanics/terrain-transforms.ts"),
    transformsFile,
  );

  const linksFile = [
    'import type { ObjectType, TerrainType } from "../data/types.js";',
    'import { ObjectId, Terrain, type Direction } from "./ids.js";',
    "",
    cloudInfoBlock
      .replace(
        "const cloudInfo: Array<[ObjectType, ObjectType]> =",
        "export const CLOUD_INFO: Array<[ObjectType, ObjectType]> =",
      )
      .trim(),
    "",
    linksBlock.replaceAll("cloudInfo", "CLOUD_INFO").trim(),
    "",
  ].join("\n");
  fs.writeFileSync(
    path.join(root, "engine/src/mechanics/mechanic-links.ts"),
    linksFile,
  );

  const sharedImports = [
    "import {",
    "  DYNAMIC_IDS,",
    "  HIDDEN_AUTHORING_OBJECTS,",
    "  environmentTraits,",
    "  isWalkableSemantic,",
    "  isWaterSemantic,",
    "  pretty,",
    '} from "./definition-semantics.js";',
    "import {",
    "  CAROUSEL_NEXT,",
    "  rotateCarousel,",
    "  toggleColor,",
    "  toggleSpeed,",
    "  toggleTide,",
    '} from "./terrain-transforms.js";',
    'import { CLOUD_INFO } from "./mechanic-links.js";',
    "import type {",
    "  TileAuthoring,",
    "  TileDefinition,",
    "  TileDefinitionInspection,",
    "  TilePresentation,",
    "  TileTrait,",
    '} from "./definition-types.js";',
    "export type {",
    "  TileAuthoring,",
    "  TileDefinition,",
    "  TileDefinitionInspection,",
    "  TilePresentation,",
    "  TileTrait,",
    '} from "./definition-types.js";',
    "",
  ].join("\n");

  source = source.replace(typeBlock, sharedImports);
  source = source.replace(semanticsBlock, "");
  source = source.replace(transformsBlock, "");
  source = source.replace(cloudInfoBlock, "");
  source = source.replaceAll("cloudInfo", "CLOUD_INFO");
  source = source.replace(
    linksBlock,
    [
      "export {",
      "  cloudGridForObject,",
      "  tideDirectionForTerrain,",
      "  windmillInfoForObject,",
      "  windSwitchIndexForTerrain,",
      "  windSwitchPeerForTerrain,",
      '} from "./mechanic-links.js";\n',
    ].join("\n"),
  );

  fs.writeFileSync(file, source);
}

function splitWorldTypes() {
  const file = path.join(root, "engine/src/world/World.ts");
  let source = fs.readFileSync(file, "utf8");

  if (source.includes("./WorldTypes.js")) return;

  const block = take(
    source,
    "export interface WorldEvent",
    "const GROUND_AFTER_MOW",
  );
  const typesFile = [
    'import type { LevelObject, ObjectType, TerrainType } from "@bobby/model";',
    'import type { Direction } from "../mechanics/ids.js";',
    'import type { PassageResult } from "../mechanics/rules.js";',
    'import type { TileDefinitionInspection } from "../mechanics/definitions.js";',
    'import type { DynamicEntity, Point } from "./RuntimeState.js";',
    "",
    block.trim(),
    "",
  ].join("\n");
  fs.writeFileSync(
    path.join(root, "engine/src/world/WorldTypes.ts"),
    typesFile,
  );

  source = source.replace(
    block,
    [
      'import type { MoveResult, TileInspection, WorldEvent } from "./WorldTypes.js";',
      'export type { MoveResult, TileInspection, WorldEvent } from "./WorldTypes.js";',
      "",
    ].join("\n"),
  );
  fs.writeFileSync(file, source);
}

function splitGameStyles() {
  const styleFile = path.join(root, "web/style.css");
  const gameStyleFile = path.join(root, "web/game-ui.css");
  let style = fs.readFileSync(styleFile, "utf8");

  if (!fs.existsSync(gameStyleFile)) {
    const marker = "/* ---------- Play HUD v2 ---------- */";
    const index = style.indexOf(marker);
    if (index < 0) throw new Error(`找不到 CSS 拆分标记：${marker}`);

    const gameStyle = style.slice(index).trimStart();
    style = `${style.slice(0, index).trimEnd()}\n`;
    fs.writeFileSync(styleFile, style);
    fs.writeFileSync(gameStyleFile, gameStyle);
  }

  const htmlFile = path.join(root, "web/index.html");
  let html = fs.readFileSync(htmlFile, "utf8");
  if (!html.includes('href="game-ui.css"')) {
    html = html.replace(
      /(<link\s+rel="stylesheet"\s+href="style\.css"\s*\/?>)/,
      '$1\n    <link rel="stylesheet" href="game-ui.css" />',
    );
    fs.writeFileSync(htmlFile, html);
  }

  const buildFile = path.join(root, "tools/scripts/build.mjs");
  let build = fs.readFileSync(buildFile, "utf8");
  if (!build.includes('"game-ui.css"')) {
    build = build.replace(
      '["index.html", "style.css", "level-filters.css", "adventure.css"]',
      '["index.html", "style.css", "game-ui.css", "level-filters.css", "adventure.css"]',
    );
    fs.writeFileSync(buildFile, build);
  }
}

function take(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) {
    throw new Error(`拆分标记不存在：${startMarker} -> ${endMarker}`);
  }
  return source.slice(start, end);
}
