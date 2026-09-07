import {
  MapEntityTypeId,
  type SurfaceSourceMapping,
} from "@bobby/model";

/** 根据单个 atlas variant 还原原版 Surface 的地图内语义。 */
export function originalSurfaceTraits(
  mapping: Readonly<SurfaceSourceMapping>,
): readonly string[] {
  if (
    mapping.type === MapEntityTypeId.SURFACE ||
    mapping.type === MapEntityTypeId.FENCE
  ) return [];

  const number = (mapping.source.row - 1) * 16 + mapping.source.column;
  const traits = new Set<string>();
  if (number >= 95 && number <= 148) traits.add("walkable");
  if (number <= 94) traits.add("bean-growth-space");
  if (number >= 72 && number <= 77) traits.add("cloud-space");
  if (
    mapping.type === MapEntityTypeId.WATER ||
    mapping.type === MapEntityTypeId.WATER_RIPPLE ||
    mapping.type === MapEntityTypeId.WATERFALL
  ) {
    traits.add("water");
    traits.add("bean-growth-space");
  }
  if (mapping.type === MapEntityTypeId.WATERFALL) traits.add("waterfall");
  return [...traits];
}

/** Definition 只保留同一 type 所有 variant 共有的 Trait。 */
export function sharedOriginalSurfaceTraits(
  mappings: readonly SurfaceSourceMapping[],
): string[] {
  if (mappings.length === 0) return [];
  const traitSets = mappings.map(
    (mapping) => new Set(originalSurfaceTraits(mapping)),
  );
  const first = traitSets[0];
  if (!first) return [];
  const rest = traitSets.slice(1);
  return [...first].filter((trait) =>
    rest.every((traits) => traits.has(trait))
  );
}
