import {
  ObjectId,
  Terrain,
  type LevelMap,
  type LevelObject,
  type LevelObjectProperties,
  type ObjectType,
  type TerrainType,
} from "@bobby/model";
import {
  collapseObjectLayouts,
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
    schemaVersion: 2,
    name: "Untitled Bobby Level",
    width: safeWidth,
    height: safeHeight,
    terrain,
    objects: [],
  };
}

export function fromLevelMap(
  level: LevelMap,
  name = "Bobby Level",
): EditorLevel {
  const anchors = collapseObjectLayouts(level.objects);
  return normalizeEditorLevel({
    schemaVersion: 2,
    name,
    width: level.width,
    height: level.height,
    terrain: level.terrain.map((row) => [...row]),
    objects: anchors.map(cloneObject),
    ...(level.rules ? { rules: { ...level.rules } } : {}),
  });
}

export function toLevelMap(level: EditorLevel): LevelMap {
  const normalized = normalizeEditorLevel(level);
  return {
    width: normalized.width,
    height: normalized.height,
    terrain: normalized.terrain.map((row) => [...row]),
    objects: normalized.objects.map(cloneObject),
    ...(normalized.rules ? { rules: { ...normalized.rules } } : {}),
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
    objects.push({
      type,
      x,
      y,
      ...(properties ? { properties } : {}),
    });
  }
  const level: EditorLevel = {
    schemaVersion: 2,
    name: String(input.name || "Untitled Bobby Level").slice(0, 120),
    width,
    height,
    terrain,
    objects,
  };
  if (input.author) level.author = String(input.author).slice(0, 80);
  if (input.description)
    level.description = String(input.description).slice(0, 500);
  const maxMoves = Number(input.rules?.maxMoves);
  if (Number.isInteger(maxMoves) && maxMoves > 0)
    level.rules = { maxMoves };
  return level;
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
    ...(object.properties
      ? { properties: { ...object.properties } }
      : {}),
  };
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
