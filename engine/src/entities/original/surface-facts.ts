import {
  MapEntityTypeId,
  type SurfaceSourceMapping,
} from "@bobby/model";

/** 根据 Surface 的语义身份声明共享通行事实。 */
export function originalSurfaceFacts(
  mapping: Readonly<SurfaceSourceMapping>,
): readonly string[] {
  const type = mapping.type;
  if (type === MapEntityTypeId.STARFIELD || type === MapEntityTypeId.MOON)
    return ["sky"];
  if (type === MapEntityTypeId.WATER || type === MapEntityTypeId.WATERFALL)
    return ["water"];
  if (
    type === MapEntityTypeId.GRASS ||
    type === MapEntityTypeId.SNOW_CLOUD ||
    type === MapEntityTypeId.SAND
  )
    return ["walkable"];
  return [];
}

/** Definition 只保留同一 type 所有 variant 共有的 Fact。 */
export function sharedOriginalSurfaceFacts(
  mappings: readonly SurfaceSourceMapping[],
): string[] {
  if (mappings.length === 0) return [];
  const factSets = mappings.map(
    (mapping) => new Set(originalSurfaceFacts(mapping)),
  );
  const first = factSets[0];
  if (!first) return [];
  const rest = factSets.slice(1);
  return [...first].filter((fact) =>
    rest.every((facts) => facts.has(fact))
  );
}
