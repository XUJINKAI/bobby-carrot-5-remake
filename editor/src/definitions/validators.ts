import type { EntityCatalog } from "@bobby/engine";
import type { WinCondition } from "@bobby/model";
import type { LevelValidationIssue } from "../level/types.js";
import type { EditorMapValidator } from "./types.js";

export const registeredEntityTypesValidator: EditorMapValidator = ({
  map,
  catalog,
}) => {
  const issues: LevelValidationIssue[] = [];
  map.entities.forEach((entity, index) => {
    if (catalog.has(entity.type)) return;
    issues.push({
      level: "error",
      message: `Entity #${index + 1} 使用未注册 type：${entity.type}`,
    });
  });
  return issues;
};

export const playerPresenceValidator: EditorMapValidator = ({
  map,
  catalog,
}) => {
  const players = knownEntities(map.entities, catalog).filter(
    ({ entity, definition }) =>
      definition.traits.includes("player") ||
      entity.traits?.includes("player") === true,
  );
  if (players.length > 0) return [];
  return [
    {
      level: "warning",
      message:
        "地图至少需要一个 player Entity 才能 Play Test；当前为 0 个。仍可继续编辑和保存。",
    },
  ];
};

export const reachTargetValidator: EditorMapValidator = ({ map, catalog }) => {
  const known = knownEntities(map.entities, catalog);
  const issues: LevelValidationIssue[] = [];
  for (const selector of requiredReachSelectors(map.rules?.win)) {
    const exists = known.some(
      ({ entity, definition }) =>
        entity.type === selector ||
        definition.traits.includes(selector) ||
        entity.traits?.includes(selector) === true ||
        definition.footprint?.parts.some((part) =>
          part.traits?.includes(selector),
        ) === true,
    );
    if (!exists) {
      issues.push({
        level: "warning",
        message: `当前获胜条件需要 selector '${selector}'，地图中没有对应 Entity。`,
      });
    }
  }
  return issues;
};

function knownEntities(
  entities: readonly import("@bobby/model").LevelEntity[],
  catalog: EntityCatalog,
) {
  return entities.flatMap((entity) =>
    catalog.has(entity.type)
      ? [{ entity, definition: catalog.require(entity.type) }]
      : [],
  );
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
