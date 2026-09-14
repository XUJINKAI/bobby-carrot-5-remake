import type {
  LevelEntity,
  LevelMap,
  WinCondition,
} from "@bobby/model";
import { levelEntityContractIssues } from "@bobby/model";
import { initializeOriginalLevelEntity } from "../entities/original/initialize-level-entity.js";
import { factRegistry } from "../entities/registry.js";
import type { FactRegistry } from "../fact/FactRegistry.js";
import type { EntityCatalog } from "../entities/EntityCatalog.js";
import type { EntityCatalogEntry } from "../entities/EntityCatalog.js";
import { EntityStore } from "../world/entity/EntityStore.js";
import { levelRuleSelector } from "../world/spatial/EntitySelector.js";
import { resolveFootprintCells } from "../world/spatial/Footprint.js";
import { SpatialIndex } from "../world/spatial/SpatialIndex.js";

export type LevelRuntimeWarningCode =
  | "missing-player"
  | "missing-reach-target"
  | "unknown-entity"
  | "invalid-entity";

export interface LevelRuntimeWarning {
  code: LevelRuntimeWarningCode;
  message: string;
}

/**
 * 只检查“这张地图是否具备正常游玩所需条件”。
 * 这些问题不会阻止 Engine 建立 World 或渲染地图；结构合法性仍由正常 load 边界负责。
 */
export function validateLevelPlayability(
  level: LevelMap,
  catalog: EntityCatalog,
  facts: FactRegistry = factRegistry,
): LevelRuntimeWarning[] {
  const known = level.entities.flatMap((entity) => {
    return catalog.has(entity.type) && levelEntityContractIssues(entity).length === 0
      ? [{ entity, definition: catalog.require(entity.type) }]
      : [];
  });
  const warnings: LevelRuntimeWarning[] = [];

  for (const type of new Set(
    level.entities
      .map((entity) => entity.type)
      .filter((type) => !catalog.has(type)),
  )) {
    warnings.push({
      code: "unknown-entity",
      message: `未知 Entity '${type}' 将作为无功能占位符显示。`,
    });
  }

  level.entities.forEach((entity, index) => {
    const issues = levelEntityContractIssues(entity);
    if (issues.length === 0) return;
    warnings.push({
      code: "invalid-entity",
      message: `Entity #${index + 1} (${entity.type}) 将作为无功能占位符显示：${issues.join("；")}。`,
    });
  });

  const projectable = known.filter(({ entity, definition }) =>
    hasProjectableFootprint(entity, definition, level)
  );
  const store = new EntityStore(
    projectable.map(({ entity }) => entity),
    initializeOriginalLevelEntity,
  );
  const spatial = new SpatialIndex(
    store,
    catalog.entities,
    level.width,
    level.height,
    facts,
  );

  if (spatial.entityCountMatching({ kind: "fact", value: "player" }) === 0) {
    warnings.push({
      code: "missing-player",
      message: "地图至少需要一个 player Entity。",
    });
  }

  for (const selector of requiredReachSelectors(level.rules?.win)) {
    if (spatial.entityCountMatching(levelRuleSelector(selector)) > 0) continue;
    warnings.push({
      code: "missing-reach-target",
      message: `当前获胜条件需要 selector '${selector}'，地图中没有对应 Entity。`,
    });
  }

  return warnings;
}

function hasProjectableFootprint(
  entity: LevelEntity,
  definition: EntityCatalogEntry,
  level: LevelMap,
): boolean {
  try {
    const instance = initializeOriginalLevelEntity(0, entity);
    return resolveFootprintCells(
      instance,
      definition.footprint,
    ).every((part) =>
      part.x >= 0 &&
      part.y >= 0 &&
      part.x < level.width &&
      part.y < level.height
    );
  } catch {
    // 加载边界负责报告结构错误；告警只查询可建立的语义投影。
    return false;
  }
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
