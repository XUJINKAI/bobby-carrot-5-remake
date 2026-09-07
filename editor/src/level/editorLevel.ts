import {
  EntityTypeId,
  MapEntityTypeId,
  type JsonPrimitive,
  type LevelEntity,
  type LevelLimit,
  type LevelMap,
  type WinCondition,
} from "@bobby/model";
import type { EditorMap } from "./types.js";

export function createBlankLevel(width = 16, height = 16): EditorMap {
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
            : MapEntityTypeId.GRASS,
        x,
        y,
        ...(x === exit.x && y === exit.y
          ? {}
          : { variant: "ts-10-1" }),
      });
  entities.push({
    type: EntityTypeId.BOBBY,
    x: Math.min(2, safeWidth - 1),
    y: Math.min(2, safeHeight - 1),
  });
  return {
    schemaVersion: 1,
    meta: { name: "Untitled Bobby Level" },
    width: safeWidth,
    height: safeHeight,
    entities,
    rules: { win: defaultWinCondition() },
  };
}

export function fromLevelMap(
  level: LevelMap,
  name = "Bobby Level",
): EditorMap {
  return normalizeEditorLevel({
    ...structuredClone(level),
    meta: { name },
  });
}

export function toLevelMap(level: EditorMap): LevelMap {
  const normalized = normalizeEditorLevel(level);
  return {
    schemaVersion: 1,
    width: normalized.width,
    height: normalized.height,
    ...(normalized.music ? { music: normalized.music } : {}),
    ...(normalized.note ? { note: normalized.note } : {}),
    entities: normalized.entities.map(cloneEntity),
    ...(normalized.rules ? { rules: structuredClone(normalized.rules) } : {}),
  };
}

export function cloneEditorLevel(level: EditorMap): EditorMap {
  return normalizeEditorLevel(structuredClone(level));
}

export function normalizeEditorLevel(input: EditorMap): EditorMap {
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
  const level: EditorMap = {
    schemaVersion: 1,
    meta: {
      name: String(input.meta?.name || "Untitled Bobby Level").slice(0, 120),
    },
    width,
    height,
    entities,
  };
  if (input.meta?.author)
    level.meta.author = String(input.meta.author).slice(0, 80);
  if (input.meta?.description)
    level.meta.description = String(input.meta.description).slice(0, 500);
  if (typeof input.music === "string" && input.music)
    level.music = input.music;
  if (typeof input.note === "string" && input.note)
    level.note = input.note.slice(0, 500);
  const limits = normalizeLimits(input.rules?.limits);
  level.rules = {
    ...(limits.length > 0 ? { limits } : {}),
    win: input.rules?.win
      ? structuredClone(input.rules.win)
      : defaultWinCondition(),
  };
  return level;
}

export function resizeEditorLevel(
  level: EditorMap,
  width: number,
  height: number,
): EditorMap {
  return normalizeEditorLevel({ ...level, width, height });
}

function normalizeLimits(value: readonly LevelLimit[] | undefined): LevelLimit[] {
  if (!Array.isArray(value)) return [];
  const result: LevelLimit[] = [];
  for (const limit of value) {
    if (limit?.type === "max-moves") {
      const moves = Math.trunc(Number(limit.moves));
      if (Number.isFinite(moves) && moves > 0)
        result.push({ type: "max-moves", moves });
    } else if (limit?.type === "max-time-seconds") {
      const seconds = Math.trunc(Number(limit.seconds));
      if (Number.isFinite(seconds) && seconds > 0)
        result.push({ type: "max-time-seconds", seconds });
    }
  }
  return result;
}

function normalizeEntity(raw: LevelEntity): LevelEntity | null {
  if (!raw || typeof raw !== "object") return null;
  const type = typeof raw.type === "string" ? raw.type.trim() : "";
  const x = Math.trunc(Number(raw.x));
  const y = Math.trunc(Number(raw.y));
  if (!type || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const entity: LevelEntity = { type, x, y };
  if (Number.isFinite(raw.stackOrder))
    entity.stackOrder = Math.trunc(raw.stackOrder!);
  for (const [key, value] of Object.entries(raw)) {
    if (key === "type" || key === "x" || key === "y" || key === "stackOrder")
      continue;
    if (!key || !isJsonPrimitive(value)) continue;
    entity[key] = value;
  }
  return entity;
}

function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
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
