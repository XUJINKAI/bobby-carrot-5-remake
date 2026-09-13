import {
  MapEntityTypeId,
  type SurfaceSourceMapping,
} from "@bobby/model";

/** 根据单个 atlas variant 还原原版 Surface 的地图内语义。 */
export function originalSurfaceFacts(
  mapping: Readonly<SurfaceSourceMapping>,
): readonly string[] {
  if (
    mapping.type === MapEntityTypeId.FENCE
  ) return [];

  const number = (mapping.source.row - 1) * 16 + mapping.source.column;
  const facts = new Set<string>();
  if (number >= 95 && number <= 148) facts.add("walkable");
  if (number <= 94) facts.add("bean-growth-space");
  if (number >= 72 && number <= 77) facts.add("cloud-space");
  if (
    mapping.type === MapEntityTypeId.WATER ||
    mapping.type === MapEntityTypeId.WATERFALL
  ) {
    facts.add("water");
    facts.add("bean-growth-space");
  }
  return [...facts];
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
