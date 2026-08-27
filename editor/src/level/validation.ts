import type { EntityCatalog } from "@bobby/engine/authoring";
import type { WinCondition } from "@bobby/model";
import type { EditorLevel, LevelValidationIssue } from "./types.js";

export function validateEditorLevel(level: EditorLevel, catalog: EntityCatalog): LevelValidationIssue[] {
  const issues: LevelValidationIssue[] = [];
  const known = level.entities.filter((entity, index) => {
    if (catalog.has(entity.type)) return true;
    issues.push({ level: "error", message: `Entity #${index + 1} 使用未注册 type：${entity.type}` });
    return false;
  });

  const players = known.filter((entity) => {
    const definition = catalog.require(entity.type);
    return definition.traits.includes("player") || entity.traits?.includes("player") === true;
  });
  if (players.length !== 1)
    issues.push({ level: "error", message: `地图必须且只能包含一个 player Entity，当前为 ${players.length} 个。` });

  for (const trait of requiredReachTraits(level.rules?.win)) {
    const exists = known.some((entity) => {
      const definition = catalog.require(entity.type);
      return definition.traits.includes(trait) || entity.traits?.includes(trait) === true || definition.footprint?.parts.some((part) => part.traits?.includes(trait)) === true;
    });
    if (!exists) issues.push({ level: "warning", message: `当前获胜条件需要 Trait '${trait}'，地图中没有对应 Entity。` });
  }
  return issues;
}

function requiredReachTraits(condition: WinCondition | undefined): Set<string> {
  const result = new Set<string>();
  collectRequiredReachTraits(condition, result);
  return result;
}

function collectRequiredReachTraits(condition: WinCondition | undefined, result: Set<string>): void {
  if (!condition) return;
  switch (condition.type) {
    case "reach": result.add(condition.trait); break;
    case "all": for (const child of condition.conditions) collectRequiredReachTraits(child, result); break;
    case "any": if (condition.conditions.length === 1) collectRequiredReachTraits(condition.conditions[0], result); break;
  }
}
