import {
  BC5R_GAME_ID,
  MapEntityTypeId,
  parseLevelMap,
  parseMapDocument,
  type LevelEntity,
  type LevelMap,
  type WinCondition,
} from "@bobby/model";
import type { EditorMap } from "./types.js";

export function createBlankLevel(width = 16, height = 16): EditorMap {
  const safeWidth = editorDimension(width, 16);
  const safeHeight = editorDimension(height, 16);
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
            ? MapEntityTypeId.EXIT
            : MapEntityTypeId.GRASS,
        x,
        y,
        ...(x === exit.x && y === exit.y
          ? {}
          : { variant: "ts-10-1" }),
      });
  entities.push({
    type: MapEntityTypeId.BOBBY,
    x: Math.min(2, safeWidth - 1),
    y: Math.min(2, safeHeight - 1),
  });
  return {
    schemaVersion: 1,
    meta: { game: BC5R_GAME_ID, name: "Untitled Bobby Level" },
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
  const parsed = parseLevelMap(level);
  return {
    ...structuredClone(parsed),
    meta: { game: BC5R_GAME_ID, name },
  };
}

export function toLevelMap(level: EditorMap): LevelMap {
  return parseLevelMap(level);
}

export function cloneEditorLevel(level: EditorMap): EditorMap {
  return structuredClone(level);
}

/**
 * Editor 只验证 MapDocument，不在读取、History 或命令提交时改写地图语义。
 * 尺寸、metadata、music、rules 与 Entity 内容只有显式编辑操作才能改变。
 */
export function normalizeEditorLevel(input: EditorMap): EditorMap {
  parseMapDocument(input);
  return structuredClone(input);
}

export function resizeEditorLevel(
  level: EditorMap,
  width: number,
  height: number,
): EditorMap {
  const safeWidth = editorDimension(width, level.width);
  const safeHeight = editorDimension(height, level.height);
  const resized = structuredClone(level);
  resized.width = safeWidth;
  resized.height = safeHeight;
  resized.entities = resized.entities.filter(
    (entity) =>
      entity.x >= 0 &&
      entity.y >= 0 &&
      entity.x < safeWidth &&
      entity.y < safeHeight,
  );
  return normalizeEditorLevel(resized);
}

function defaultWinCondition(): WinCondition {
  return { type: "exit" };
}

function editorDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.trunc(value));
}
