import {
  purchasedAdventureItemPatches,
  type AdventureAugmentation,
  type AdventureItemPurchaseOffer,
  type AdventureSave,
} from "@bobby/adventure";
import type {
  CommitEntityReplacementIntent,
  ObjectInteractionEvent,
} from "@bobby/engine";
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
    ...(save ? purchasedAdventureItemPatches(augmentation, save) : []),
    ...sessionPatches,
  ]);
}

/** Web 只负责把已结算的购买结果映射为 Engine 通用地图动作。 */
export function adventureItemReplacementIntent(
  offer: AdventureItemPurchaseOffer,
  request: ObjectInteractionEvent,
): CommitEntityReplacementIntent | null {
  if (offer.replacementType === undefined) return null;
  return {
    type: "commit-entity-replacement",
    target: {
      type: request.objectType,
      x: request.x,
      y: request.y,
    },
    replacementType: offer.replacementType,
  };
}
