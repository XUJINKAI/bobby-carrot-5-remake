import { Terrain, type WinCondition } from "@bobby/model";
import {
  resolveLevelPlayerStart,
  terrainHasTrait,
} from "@bobby/engine";
import { normalizeEditorLevel } from "./editorLevel.js";
import type { EditorLevel, LevelValidationIssue } from "./types.js";

export function validateEditorLevel(
  level: EditorLevel,
): LevelValidationIssue[] {
  const normalized = normalizeEditorLevel(level);
  const issues: LevelValidationIssue[] = [];
  try {
    resolveLevelPlayerStart(normalized);
  } catch (error) {
    issues.push({
      level: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }

  let exits = 0;
  for (const row of normalized.terrain)
    for (const type of row)
      if (terrainHasTrait(type, "exit")) exits += 1;

  if (requiresTerrainTrait(normalized.rules?.win, "exit") && exits === 0)
    issues.push({
      level: "warning",
      message: `当前获胜条件需要 ${Terrain.EXIT} terrain，但地图中不存在出口。`,
    });
  return issues;
}

function requiresTerrainTrait(
  condition: WinCondition | undefined,
  trait: string,
): boolean {
  if (!condition) return false;
  switch (condition.type) {
    case "reach-terrain":
      return condition.trait === trait;
    case "all":
      return condition.conditions.some((item) =>
        requiresTerrainTrait(item, trait),
      );
    case "any":
      return (
        condition.conditions.length > 0 &&
        condition.conditions.every((item) => requiresTerrainTrait(item, trait))
      );
    default:
      return false;
  }
}
