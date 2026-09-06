import type { EntityType, JsonPrimitive, LevelMap } from "@bobby/model";

export interface AdventureEntityFieldPatch {
  x?: number;
  y?: number;
  type?: EntityType;
  fields: Record<string, JsonPrimitive>;
}

/**
 * Adventure can override canonical flat Map entity fields before a LevelMap enters Engine.
 * x / y / type are optional selectors; at least one selector is required.
 * The resulting LevelMap still uses the same public Map ABI as Editor/custom/original maps.
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
