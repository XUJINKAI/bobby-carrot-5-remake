import {
  type AdventureAugmentation,
  type AdventureSave,
} from "@bobby/adventure";
import {
  applyLevelPatches,
  type LevelMap,
  type LevelPatch,
} from "@bobby/model";

/** 把持久商品状态与本次 Session 补丁统一投影到 Engine 输入地图。 */
export function prepareAdventureGameplayLevel(
  level: LevelMap,
  augmentation: AdventureAugmentation,
  save: AdventureSave | null,
  sessionPatches: readonly LevelPatch[],
): LevelMap {
  return applyLevelPatches(level, [
    ...augmentation.levelPatches,
    ...(save ? augmentation.savePatches?.(save) ?? [] : []),
    ...sessionPatches,
  ]);
}
