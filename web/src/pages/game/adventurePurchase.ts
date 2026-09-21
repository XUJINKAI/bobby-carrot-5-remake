import {
  type AdventureAugmentation,
  type AdventureSave,
} from "@bobby/adventure";
import {
  applyLevelPatches,
  type LevelMap,
} from "@bobby/model";

/** 把 Adventure 静态配置与永久状态统一投影到 Engine 输入地图。 */
export function prepareAdventureGameplayLevel(
  level: LevelMap,
  augmentation: AdventureAugmentation,
  save: AdventureSave | null,
): LevelMap {
  return applyLevelPatches(level, [
    ...augmentation.levelPatches,
    ...(save ? augmentation.levelPatchesFunction?.(save) ?? [] : []),
  ]);
}
