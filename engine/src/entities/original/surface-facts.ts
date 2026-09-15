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
