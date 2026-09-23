import { MapEntityTypeId } from "@bobby/model";

/** Original source 的目标模式由 canonical Entity 事实决定，不再依赖跨玩法聚合 Trait。 */
export function deriveOriginalWinCondition(level) {
  const types = new Set(level.entities.map((entity) => entity.type));
  const exit = types.has(MapEntityTypeId.EXIT)
    ? { type: "exit" }
    : null;
  if (types.has(MapEntityTypeId.GOLDEN_CARROT)) {
    const goldenCarrot = { type: "golden-carrot" };
    return exit
      ? {
          type: "any",
          conditions: [goldenCarrot, exit],
        }
      : goldenCarrot;
  }
  if (types.has(MapEntityTypeId.CARROT)) {
    const carrots = { type: "carrot" };
    return exit ? { type: "all", conditions: [carrots, exit] } : carrots;
  }
  if (types.has(MapEntityTypeId.EGG)) {
    const eggs = { type: "egg" };
    return exit ? { type: "all", conditions: [eggs, exit] } : eggs;
  }
  return exit ?? undefined;
}
