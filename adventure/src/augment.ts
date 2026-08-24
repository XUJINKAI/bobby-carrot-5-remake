import type {
  LevelMap,
  LevelObjectProperties,
  ObjectType,
} from "@bobby/model";

export interface AdventureObjectPropertiesPatch {
  x: number;
  y: number;
  type?: ObjectType;
  properties: LevelObjectProperties;
}

/**
 * Adventure 可以在纯 LevelMap 进入 Engine 前覆盖对象实例参数。
 * Engine 不知道这些参数来自 Adventure；Maker JSON 也走同一个 LevelObject.properties。
 */
export function augmentAdventureLevel(
  level: LevelMap,
  patches: readonly AdventureObjectPropertiesPatch[] = [],
): LevelMap {
  const result = structuredClone(level);
  for (const patch of patches) {
    const object = result.objects.find(
      (candidate) =>
        candidate.x === patch.x &&
        candidate.y === patch.y &&
        (patch.type === undefined || candidate.type === patch.type),
    );
    if (!object) continue;
    object.properties = {
      ...(object.properties ?? {}),
      ...patch.properties,
    };
  }
  return result;
}
