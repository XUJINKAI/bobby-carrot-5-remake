import type {
  EntityProperties,
  EntityType,
  LevelMap,
} from "@bobby/model";

export interface AdventureEntityPropertiesPatch {
  x?: number;
  y?: number;
  type?: EntityType;
  properties: EntityProperties;
}

/**
 * Adventure 可以在纯 LevelMap 进入 Engine 前覆盖 Entity 实例参数。
 * Engine 不知道这些参数来自 Adventure；Editor JSON 也走同一个 LevelEntity.properties。
 *
 * x / y / type 都是可选 selector；至少要提供一个。只给 type 时会匹配该类型的全部 Entity，
 * 便于 Adventure 给原版地图注入玩法策略，而不用把坐标或 Adventure policy 写回 Original Adapter。
 */
export function augmentAdventureLevel(
  level: LevelMap,
  patches: readonly AdventureEntityPropertiesPatch[] = [],
): LevelMap {
  const result = structuredClone(level);
  for (const patch of patches) {
    if (patch.x === undefined && patch.y === undefined && patch.type === undefined)
      throw new Error("Adventure Entity patch 至少需要 x / y / type 中的一个 selector");
    for (const entity of result.entities) {
      if (patch.x !== undefined && entity.x !== patch.x) continue;
      if (patch.y !== undefined && entity.y !== patch.y) continue;
      if (patch.type !== undefined && entity.type !== patch.type) continue;
      entity.properties = {
        ...(entity.properties ?? {}),
        ...patch.properties,
      };
    }
  }
  return result;
}
