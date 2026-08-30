import type { EntityCatalog } from "@bobby/engine/authoring";
import type { WinCondition } from "@bobby/model";
import type { EditorLevel, LevelValidationIssue } from "./types.js";

export function validateEditorLevel(
  level: EditorLevel,
  catalog: EntityCatalog,
): LevelValidationIssue[] {
  const issues: LevelValidationIssue[] = [];
  const known = level.entities.filter((entity, index) => {
    if (catalog.has(entity.type)) return true;
    issues.push({
      level: "error",
      message: `Entity #${index + 1} 使用未注册 type：${entity.type}`,
    });
    return false;
  });

  const players = known.filter((entity) => {
    const definition = catalog.require(entity.type);
    return (
      definition.traits.includes("player") ||
      entity.traits?.includes("player") === true
    );
  });
  if (players.length === 0)
    issues.push({
      level: "warning",
      message: "地图当前没有 player Entity；仍可继续编辑和保存。",
    });

  for (const selector of requiredReachSelectors(level.rules?.win)) {
    const exists = known.some((entity) => {
      const definition = catalog.require(entity.type);
      return (
        entity.type === selector ||
        definition.traits.includes(selector) ||
        entity.traits?.includes(selector) === true ||
        definition.footprint?.parts.some((part) =>
          part.traits?.includes(selector),
        ) === true
      );
    });
    if (!exists)
      issues.push({
        level: "warning",
        message: `当前获胜条件需要 selector '${selector}'，地图中没有对应 Entity。`,
      });
  }
  return issues;
}

function requiredReachSelectors(
  condition: WinCondition | undefined,
): Set<string> {
  const result = new Set<string>();
  collectRequiredReachSelectors(condition, result);
  return result;
}

function collectRequiredReachSelectors(
  condition: WinCondition | undefined,
  result: Set<string>,
): void {
  if (!condition) return;
  switch (condition.type) {
    case "reach":
      result.add(condition.target);
      break;
    case "all":
      for (const child of condition.conditions)
        collectRequiredReachSelectors(child, result);
      break;
    case "any":
      if (condition.conditions.length === 1)
        collectRequiredReachSelectors(condition.conditions[0], result);
      break;
  }
}
