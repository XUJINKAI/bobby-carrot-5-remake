import {
  MapEntityTypeId,
  type SurfaceSourceMapping,
} from "@bobby/model";

/** 根据 Surface 的语义身份声明共享通行事实。 */
export function originalSurfaceFacts(
  mapping: Readonly<SurfaceSourceMapping>,
): readonly string[] {
  const type = mapping.type;
  const growth = isOriginalGrowthSubstrate(mapping)
    ? ["growth-substrate"]
    : [];
  if (type === MapEntityTypeId.STARFIELD || type === MapEntityTypeId.MOON)
    return ["sky", ...growth];
  if (type === MapEntityTypeId.WATER || type === MapEntityTypeId.WATERFALL)
    return ["water", ...growth];
  if (
    type === MapEntityTypeId.GRASS ||
    type === MapEntityTypeId.SNOW_CLOUD ||
    type === MapEntityTypeId.SAND
  )
    return ["walkable", ...growth];
  return growth;
}

function isOriginalGrowthSubstrate(
  mapping: Readonly<SurfaceSourceMapping>,
): boolean {
  return mapping.source.row < 6 ||
    (mapping.source.row === 6 && mapping.source.column <= 14);
}
