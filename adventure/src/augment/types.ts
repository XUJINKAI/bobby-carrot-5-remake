import type {
  EntityType,
  LevelEntitySelector,
  LevelPatch,
} from "@bobby/model";
import type { AdventureItemId } from "../save.js";

export interface AdventureInteractionSelector extends LevelEntitySelector {
  action?: "touch" | "enter";
  role?: string;
}

export type AdventureInteractionEffect =
  | {
      type: "dialogue";
      lines: readonly string[];
    }
  | {
      type: "bonus-key-vendor";
      priceBonusCoins: number;
    }
  | {
      type: "item-purchase";
      offer: AdventureItemPurchaseOffer;
    };

export interface AdventureInteractionRule {
  id: string;
  selector: AdventureInteractionSelector;
  effect: AdventureInteractionEffect;
}

export interface AdventureAugmentation {
  levelPatches: readonly LevelPatch[];
  interactions: readonly AdventureInteractionRule[];
}

/** Engine `object-interaction` 的 Adventure 侧最小投影，不引入 Engine 依赖。 */
export interface AdventureInteractionRequest {
  objectType: string;
  x: number;
  y: number;
  action: "touch" | "enter";
  role?: string;
  lockKeyCount: number;
}

export interface AdventureInteractionState {
  dialogueIndexes: Map<string, number>;
}

export type AdventurePurchaseCurrency = "bonus-coins" | "golden-carrots";
export type AdventureItemPurchaseOutcome =
  | "already-owned"
  | "purchased"
  | "insufficient-funds";

export interface AdventureItemPurchaseOffer {
  item: AdventureItemId;
  currency: AdventurePurchaseCurrency;
  price: number;
  message: string;
  leftLabel: string;
  rightLabel: string;
  /** 永久购买完成后用于替换当前地图商品的语义 Entity type。 */
  replacementType?: EntityType;
  outcomeMessages: Readonly<Record<AdventureItemPurchaseOutcome, string>>;
}
