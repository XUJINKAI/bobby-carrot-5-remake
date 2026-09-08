import { MapEntityTypeId } from "@bobby/model";

export const ORIGINAL_EGG_NEST_TARGET = "egg-nest";
export const ORIGINAL_EGG_FILLER = "egg";

/** Original source 的目标模式由 canonical Entity 事实决定，不再依赖跨玩法聚合 Trait。 */
export function deriveOriginalWinCondition(level) {
  const types = new Set(level.entities.map((entity) => entity.type));
  const exit = types.has(MapEntityTypeId.EXIT)
    ? { type: "reach", target: MapEntityTypeId.EXIT }
    : null;
  if (types.has(MapEntityTypeId.GOLDEN_CARROT)) {
    const goldenCarrot = {
      type: "reach",
      target: MapEntityTypeId.GOLDEN_CARROT,
    };
    return exit
      ? {
          type: "any",
          conditions: [goldenCarrot, exit],
        }
      : goldenCarrot;
  }
  if (types.has(MapEntityTypeId.CARROT)) {
    const carrots = {
      type: "collect-all",
      target: MapEntityTypeId.CARROT,
    };
    return exit ? { type: "all", conditions: [carrots, exit] } : carrots;
  }
  if (types.has(MapEntityTypeId.EGG)) {
    const eggs = {
      type: "fill-all",
      target: ORIGINAL_EGG_NEST_TARGET,
      filler: ORIGINAL_EGG_FILLER,
    };
    return exit ? { type: "all", conditions: [eggs, exit] } : eggs;
  }
  return exit ?? undefined;
}
