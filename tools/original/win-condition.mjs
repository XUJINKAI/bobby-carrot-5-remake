import { EntityTypeId } from "@bobby/model";

export const ORIGINAL_EGG_NEST_TARGET = "egg-nest";
export const ORIGINAL_EGG_FILLER = "egg";

/** Original source 的目标模式由 canonical Entity 事实决定，不再依赖跨玩法聚合 Trait。 */
export function deriveOriginalWinCondition(level) {
  const types = new Set(level.entities.map((entity) => entity.type));
  if (types.has(EntityTypeId.GOLDEN_CARROT)) {
    const goldenCarrot = { type: "reach", target: EntityTypeId.GOLDEN_CARROT };
    return types.has(EntityTypeId.EXIT)
      ? {
          type: "any",
          conditions: [
            goldenCarrot,
            { type: "reach", target: EntityTypeId.EXIT },
          ],
        }
      : goldenCarrot;
  }
  if (types.has(EntityTypeId.CARROT))
    return { type: "collect-all", target: EntityTypeId.CARROT };
  if (
    types.has(EntityTypeId.EGG_NEST_EMPTY) ||
    types.has(EntityTypeId.EGG_NEST_FILLED)
  )
    return {
      type: "fill-all",
      target: ORIGINAL_EGG_NEST_TARGET,
      filler: ORIGINAL_EGG_FILLER,
    };
  if (types.has(EntityTypeId.EXIT))
    return { type: "reach", target: EntityTypeId.EXIT };
  return undefined;
}
