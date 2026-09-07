import type {
  Direction,
  LevelEntity,
  LevelMap,
  WinCondition,
} from "@bobby/model";
import type { EntityCatalog } from "../entities/EntityCatalog.js";
import type { EntityCatalogEntry } from "../entities/EntityCatalog.js";
import { resolveFootprintCells } from "../world/spatial/Footprint.js";

export type LevelRuntimeWarningCode =
  | "missing-player"
  | "missing-reach-target";

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
): LevelRuntimeWarning[] {
  const known = level.entities.flatMap((entity) =>
    catalog.has(entity.type)
      ? [{ entity, definition: catalog.require(entity.type) }]
      : [],
  );
  const warnings: LevelRuntimeWarning[] = [];

  if (!known.some(({ definition }) => definition.traits.includes("player"))) {
    warnings.push({
      code: "missing-player",
      message: "地图至少需要一个 player Entity。",
    });
  }

  for (const selector of requiredReachSelectors(level.rules?.win)) {
    const exists = known.some(
      ({ entity, definition }) =>
        entity.type === selector ||
        definition.traits.includes(selector) ||
        footprintHasTrait(entity, definition, selector),
    );
    if (exists) continue;
    warnings.push({
      code: "missing-reach-target",
      message: `当前获胜条件需要 selector '${selector}'，地图中没有对应 Entity。`,
    });
  }

  return warnings;
}

function footprintHasTrait(
  entity: LevelEntity,
  definition: EntityCatalogEntry,
  trait: string,
): boolean {
  if (!definition.footprint) return false;
  const direction = asDirection(entity.direction);
  try {
    return resolveFootprintCells(
      {
        anchor: { x: entity.x, y: entity.y },
        ...(direction ? { direction } : {}),
      },
      definition.footprint,
    ).some((part) => part.traits?.includes(trait));
  } catch {
    // 结构有效性由常规加载边界校验；这里仅判断地图是否存在可游玩的 reach target。
    return false;
  }
}

function asDirection(value: unknown): Direction | undefined {
  return value === "up" || value === "right" || value === "down" || value === "left"
    ? value
    : undefined;
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
