import {
  EntityTypeId,
  type EntityProperties,
  type EntityState,
  type EntityTraits,
  type JsonValue,
  type LevelEntity,
  type LevelMap,
  type WinCondition,
} from "@bobby/model";
import type { EditorLevel } from "./types.js";

export function createBlankLevel(width = 16, height = 16): EditorLevel {
  const safeWidth = clampDimension(width);
  const safeHeight = clampDimension(height);
  const exit = {
    x: Math.max(0, safeWidth - 3),
    y: Math.max(0, safeHeight - 3),
  };
  const entities: LevelEntity[] = [];
  for (let y = 0; y < safeHeight; y++)
    for (let x = 0; x < safeWidth; x++)
      entities.push({
        type:
          x === exit.x && y === exit.y
            ? EntityTypeId.EXIT
            : EntityTypeId.GROUND_C,
        x,
        y,
      });
  entities.push({
    type: EntityTypeId.BOBBY,
    x: Math.min(2, safeWidth - 1),
    y: Math.min(2, safeHeight - 1),
    direction: "down",
  });
  return {
    schemaVersion: 1,
    name: "Untitled Bobby Level",
    width: safeWidth,
    height: safeHeight,
    entities,
    rules: { win: defaultWinCondition() },
  };
}

export function fromLevelMap(
  level: LevelMap,
  name = "Bobby Level",
): EditorLevel {
  return normalizeEditorLevel({
    ...structuredClone(level),
    name,
  });
}

export function toLevelMap(level: EditorLevel): LevelMap {
  const normalized = normalizeEditorLevel(level);
  return {
    schemaVersion: 1,
    width: normalized.width,
    height: normalized.height,
    entities: normalized.entities.map(cloneEntity),
    ...(normalized.rules ? { rules: structuredClone(normalized.rules) } : {}),
  };
}

export function cloneEditorLevel(level: EditorLevel): EditorLevel {
  return normalizeEditorLevel(structuredClone(level));
}

export function normalizeEditorLevel(input: EditorLevel): EditorLevel {
  const width = clampDimension(Number(input.width));
  const height = clampDimension(Number(input.height));
  const entities = (input.entities ?? [])
    .map(normalizeEntity)
    .filter(
      (entity): entity is LevelEntity =>
        entity !== null &&
        entity.x >= 0 &&
        entity.y >= 0 &&
        entity.x < width &&
        entity.y < height,
    );
  const level: EditorLevel = {
    schemaVersion: 1,
    name: String(input.name || "Untitled Bobby Level").slice(0, 120),
    width,
    height,
    entities,
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

export function resizeEditorLevel(
  level: EditorLevel,
  width: number,
  height: number,
): EditorLevel {
  return normalizeEditorLevel({ ...level, width, height });
}

function normalizeEntity(raw: LevelEntity): LevelEntity | null {
  if (!raw || typeof raw !== "object") return null;
  const type = typeof raw.type === "string" ? raw.type.trim() : "";
  const x = Math.trunc(Number(raw.x));
  const y = Math.trunc(Number(raw.y));
  if (!type || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const entity: LevelEntity = { type, x, y };
  const direction = raw.direction;
  if (
    direction === "up" ||
    direction === "down" ||
    direction === "left" ||
    direction === "right"
  )
    entity.direction = direction;
  const properties = normalizeJsonRecord(raw.properties);
  if (properties) entity.properties = properties;
  const state = normalizeJsonRecord(raw.state);
  if (state) entity.state = state;
  const traits = normalizeTraits(raw.traits);
  if (traits) entity.traits = traits;
  return entity;
}

function normalizeJsonRecord(
  value: EntityProperties | EntityState | undefined,
): Record<string, JsonValue> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const out: Record<string, JsonValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!key || !isJsonValue(item)) continue;
    out[key] = structuredClone(item);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeTraits(value: EntityTraits | undefined): EntityTraits | undefined {
  if (!Array.isArray(value)) return undefined;
  const traits = [
    ...new Set(value.filter((item) => typeof item === "string" && item)),
  ];
  return traits.length > 0 ? traits : undefined;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value !== "object") return false;
  return Object.values(value).every(isJsonValue);
}

function defaultWinCondition(): WinCondition {
  return { type: "reach", target: EntityTypeId.EXIT };
}

function cloneEntity(entity: LevelEntity): LevelEntity {
  return structuredClone(entity);
}

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 16;
  return Math.min(128, Math.max(3, Math.trunc(value)));
}
