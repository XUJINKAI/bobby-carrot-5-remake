import type {
  EntityProperties,
  EntityType,
  LevelMap,
} from "@bobby/model";

export interface AdventureEntityPropertiesPatch {
  x: number;
  y: number;
  type?: EntityType;
  properties: EntityProperties;
}

/**
 * Adventure 可以在纯 LevelMap 进入 Engine 前覆盖 Entity 实例参数。
 * Engine 不知道这些参数来自 Adventure；Editor JSON 也走同一个 LevelEntity.properties。
 */
export function augmentAdventureLevel(
  level: LevelMap,
  patches: readonly AdventureEntityPropertiesPatch[] = [],
): LevelMap {
  const result = structuredClone(level);
  for (const patch of patches) {
    const entity = result.entities.find(
      (candidate) =>
        candidate.x === patch.x &&
        candidate.y === patch.y &&
        (patch.type === undefined || candidate.type === patch.type),
    );
    if (!entity) continue;
    entity.properties = {
      ...(entity.properties ?? {}),
      ...patch.properties,
    };
  }
  return result;
}
