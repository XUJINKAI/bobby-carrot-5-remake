import type { EntityType, JsonPrimitive, LevelMap } from "@bobby/model";

export interface AdventureEntityFieldPatch {
  x?: number;
  y?: number;
  type?: EntityType;
  fields: Record<string, JsonPrimitive>;
}

/**
 * Adventure 可以在 LevelMap 进入 Engine 前覆盖扁平的 canonical Map Entity 字段。
 * x / y / type 都是可选 selector，但至少需要一个 selector。
 * 处理后的 LevelMap 仍与 Editor、custom 和 original 地图共用公开 Map ABI。
 */
export function augmentAdventureLevel(
  level: LevelMap,
  patches: readonly AdventureEntityFieldPatch[] = [],
): LevelMap {
  const result = structuredClone(level);
  for (const patch of patches) {
    if (patch.x === undefined && patch.y === undefined && patch.type === undefined)
      throw new Error("Adventure Entity patch 至少需要 x / y / type 中的一个 selector");
    for (const entity of result.entities) {
      if (patch.x !== undefined && entity.x !== patch.x) continue;
      if (patch.y !== undefined && entity.y !== patch.y) continue;
      if (patch.type !== undefined && entity.type !== patch.type) continue;
      for (const [key, value] of Object.entries(patch.fields)) {
        if (key === "type" || key === "x" || key === "y" || key === "stackOrder")
          throw new Error(`Adventure cannot patch reserved LevelEntity field: ${key}`);
        entity[key] = value;
      }
    }
  }
  return result;
}
