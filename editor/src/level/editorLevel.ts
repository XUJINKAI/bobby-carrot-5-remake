import {
  ObjectId,
  Terrain,
  type LevelMap,
  type LevelObject,
  type LevelObjectProperties,
  type LevelObjectTraits,
  type ObjectType,
  type TerrainType,
} from "@bobby/model";
import {
  collapseObjectLayouts,
  getObjectDefinition,
  isObjectLayoutPart,
  objectLayoutFor,
} from "@bobby/engine";
import type { EditorLevel, EditorObject } from "./types.js";

export function createBlankLevel(width = 16, height = 16): EditorLevel {
  const safeWidth = clampDimension(width);
  const safeHeight = clampDimension(height);
  const terrain = Array.from({ length: safeHeight }, () =>
    Array.from({ length: safeWidth }, () => Terrain.GROUND_C as TerrainType),
  );
  terrain[Math.min(2, safeHeight - 1)]![Math.min(2, safeWidth - 1)] =
    Terrain.START;
  terrain[Math.max(0, safeHeight - 3)]![Math.max(0, safeWidth - 3)] =
    Terrain.EXIT;
  return {
    schemaVersion: 1,
    name: "Untitled Bobby Level",
    width: safeWidth,
    height: safeHeight,
    terrain,
    objects: [],
    rules: { win: defaultWinCondition() },
  };
}

export function fromLevelMap(
  level: LevelMap,
  name = "Bobby Level",
): EditorLevel {
  const anchors = collapseObjectLayouts(level.objects);
  return normalizeEditorLevel({
    schemaVersion: 1,
    name,
    width: level.width,
    height: level.height,
    ...(level.playerStart
      ? { playerStart: { ...level.playerStart } }
      : {}),
    terrain: level.terrain.map((row) => [...row]),
    objects: anchors.map(cloneObject),
    ...(level.rules ? { rules: structuredClone(level.rules) } : {}),
  });
}

export function toLevelMap(level: EditorLevel): LevelMap {
  const normalized = normalizeEditorLevel(level);
  return {
    width: normalized.width,
    height: normalized.height,
    ...(normalized.playerStart
      ? { playerStart: { ...normalized.playerStart } }
      : {}),
    terrain: normalized.terrain.map((row) => [...row]),
    objects: normalized.objects.map(cloneObject),
    ...(normalized.rules ? { rules: structuredClone(normalized.rules) } : {}),
  };
}

export function cloneEditorLevel(level: EditorLevel): EditorLevel {
  return normalizeEditorLevel(structuredClone(level));
}

export function normalizeEditorLevel(input: EditorLevel): EditorLevel {
  const width = clampDimension(Number(input.width));
  const height = clampDimension(Number(input.height));
  const terrain = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      normalizeTerrain(input.terrain?.[y]?.[x]),
    ),
  );
  const occupied = new Set<string>();
  const objects: EditorObject[] = [];
  for (const raw of input.objects ?? []) {
    const x = Math.trunc(Number(raw.x));
    const y = Math.trunc(Number(raw.y));
    const type = normalizeObject(raw.type);
    if (type === ObjectId.EMPTY || isObjectLayoutPart(type)) continue;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const cells = objectLayoutFor(type).cells.map((cell) => ({
      x: x + cell.dx,
      y: y + cell.dy,
    }));
    const outside = cells.some(
      (cell) =>
        cell.x < 0 || cell.y < 0 || cell.x >= width || cell.y >= height,
    );
    if (outside || cells.some((cell) => occupied.has(`${cell.x},${cell.y}`)))
      continue;
    for (const cell of cells) occupied.add(`${cell.x},${cell.y}`);
    const properties = normalizeProperties(raw.properties);
    const traits = normalizeTraits(type, raw.traits);
    objects.push({
      type,
      x,
      y,
      ...(traits ? { traits } : {}),
      ...(properties ? { properties } : {}),
    });
  }
  const level: EditorLevel = {
    schemaVersion: 1,
    name: String(input.name || "Untitled Bobby Level").slice(0, 120),
    width,
    height,
    terrain,
    objects,
  };
  if (input.playerStart)
    level.playerStart = {
      x: Number(input.playerStart.x),
      y: Number(input.playerStart.y),
    };
  if (input.author) level.author = String(input.author).slice(0, 80);
  if (input.description)
    level.description = String(input.description).slice(0, 500);
  const maxMoves = Number(input.rules?.maxMoves);
  level.rules = {
    ...(Number.isInteger(maxMoves) && maxMoves > 0 ? { maxMoves } : {}),
    win: input.rules?.win
      ? structuredClone(input.rules.win)
      : defaultWinCondition(),
  };
  return level;
}

function defaultWinCondition() {
  return {
    type: "all" as const,
    conditions: [
      { type: "collect-all" as const, trait: "level-objective" },
      {
        type: "fill-all" as const,
        terrainTrait: "push-goal",
        objectTrait: "pushable",
      },
      { type: "reach-terrain" as const, trait: "exit" },
    ],
  };
}

export function resizeEditorLevel(
  level: EditorLevel,
  width: number,
  height: number,
): EditorLevel {
  return normalizeEditorLevel({ ...level, width, height });
}

function cloneObject(object: LevelObject): EditorObject {
  return {
    type: object.type,
    x: object.x,
    y: object.y,
    ...(object.traits ? { traits: [...object.traits] } : {}),
    ...(object.properties
      ? { properties: { ...object.properties } }
      : {}),
  };
}

function normalizeTraits(
  type: ObjectType,
  value: unknown,
): LevelObjectTraits | undefined {
  if (!Array.isArray(value)) return undefined;
  const definition = getObjectDefinition(type);
  const allowed = new Set(
    (definition.authoring?.traits ?? []).map((item) => item.trait),
  );
  const traits: string[] = [];
  for (const trait of value) {
    if (typeof trait !== "string" || !allowed.has(trait as never))
      throw new Error(`Object ${type} 不允许实例 Trait：${String(trait)}`);
    traits.push(trait);
  }
  const unique = [...new Set(traits)];
  return unique.length > 0 ? unique : undefined;
}

function normalizeProperties(
  value: unknown,
): LevelObjectProperties | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const properties: LevelObjectProperties = {};
  for (const [key, item] of Object.entries(value))
    if (key.length > 0 && typeof item === "string") properties[key] = item;
  return Object.keys(properties).length > 0 ? properties : undefined;
}

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 16;
  return Math.min(128, Math.max(3, Math.trunc(value)));
}

function normalizeTerrain(value: unknown): TerrainType {
  return typeof value === "string" && value.length > 0
    ? (value as TerrainType)
    : Terrain.GROUND_C;
}

function normalizeObject(value: unknown): ObjectType {
  return typeof value === "string" && value.length > 0
    ? (value as ObjectType)
    : ObjectId.EMPTY;
}
