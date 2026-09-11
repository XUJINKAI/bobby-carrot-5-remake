import {
  completeAdventureEvent,
  grantAdventureItem,
  hasAdventureItem,
  normalizeAdventureSave,
  type AdventureItemId,
  type AdventureSave,
} from "../save.js";
import { spendBonusCoins, spendGoldenCarrots } from "../rewards.js";
import type {
  AdventureAugmentation,
  AdventureInteractionState,
  AdventureInteractionRequest,
  AdventureInteractionRule,
  AdventureItemPurchaseOffer,
  AdventureItemPurchaseOutcome,
  AdventurePurchaseCurrency,
} from "./types.js";

export const BONUS_KEY_TRIAL_EVENT = "bonus-key-trial";
export const DEFAULT_SINGLE_USE_LOCK_KEY_PRICE_BONUS_COINS = 3;

export type BonusKeyVendorOutcome =
  | "reusable-key-owned"
  | "single-use-key-held"
  | "trial-granted"
  | "purchased"
  | "insufficient-funds";

export interface BonusKeyVendorDecision {
  outcome: BonusKeyVendorOutcome;
  priceBonusCoins: number;
  grantSingleUseKey: boolean;
  save: AdventureSave;
}

export interface BonusKeyVendorRequest {
  hasSingleUseKey: boolean;
  priceBonusCoins?: number;
}

export type AdventureInteractionDecision =
  | { type: "dialogue"; text: string }
  | { type: "bonus-key-vendor"; decision: BonusKeyVendorDecision }
  | {
      type: "item-purchase";
      offer: AdventureItemPurchaseOffer;
    };

export interface AdventureItemPurchaseDecision {
  outcome: AdventureItemPurchaseOutcome;
  item: AdventureItemId;
  currency: AdventurePurchaseCurrency;
  price: number;
  save: AdventureSave;
}

export function createAdventureInteractionState(): AdventureInteractionState {
  return { dialogueIndexes: new Map() };
}

/** 永久商品的价格、扣款与授予在同一次 Adventure Save 归约中完成。 */
export function purchaseAdventureItem(
  save: AdventureSave,
  item: AdventureItemId,
  currency: AdventurePurchaseCurrency,
  price: number,
): AdventureItemPurchaseDecision {
  const normalized = normalizeAdventureSave(save);
  const cost = normalizePurchasePrice(price);
  if (hasAdventureItem(normalized, item))
    return purchaseDecision("already-owned", normalized, item, currency, cost);
  const balance = currency === "bonus-coins"
    ? normalized.economy.bonusCoins
    : normalized.economy.goldenCarrots;
  if (balance < cost)
    return purchaseDecision(
      "insufficient-funds",
      normalized,
      item,
      currency,
      cost,
    );
  const paid = currency === "bonus-coins"
    ? spendBonusCoins(normalized, cost)
    : spendGoldenCarrots(normalized, cost);
  return purchaseDecision(
    "purchased",
    grantAdventureItem(paid, item),
    item,
    currency,
    cost,
  );
}

/** 声明式规则只返回 Adventure 语义结果，Web 再适配为 Engine 动作和对话展示。 */
export function resolveAdventureInteraction(
  augmentation: AdventureAugmentation,
  save: AdventureSave,
  request: AdventureInteractionRequest,
  state: AdventureInteractionState,
): AdventureInteractionDecision | null {
  const rule = augmentation.interactions.find((candidate) =>
    matchesInteraction(candidate, request)
  );
  if (!rule) return null;
  if (rule.effect.type === "dialogue") {
    const text = nextDialogueLine(rule, state);
    return text === null ? null : { type: "dialogue", text };
  }
  if (rule.effect.type === "item-purchase") {
    return { type: "item-purchase", offer: rule.effect.offer };
  }
  return {
    type: "bonus-key-vendor",
    decision: resolveBonusKeyVendorInteraction(save, {
      hasSingleUseKey: request.hasSingleUseKey,
      priceBonusCoins: rule.effect.priceBonusCoins,
    }),
  };
}

function nextDialogueLine(
  rule: AdventureInteractionRule,
  state: AdventureInteractionState,
): string | null {
  if (rule.effect.type !== "dialogue" || rule.effect.lines.length === 0)
    return null;
  const index = state.dialogueIndexes.get(rule.id) ?? 0;
  state.dialogueIndexes.set(rule.id, (index + 1) % rule.effect.lines.length);
  return rule.effect.lines[index % rule.effect.lines.length] ?? null;
}

/** Campaign 经济只在 Adventure Save 上归约；Engine 只接收最终钥匙动作。 */
export function resolveBonusKeyVendorInteraction(
  save: AdventureSave,
  request: BonusKeyVendorRequest,
): BonusKeyVendorDecision {
  const normalized = normalizeAdventureSave(save);
  const price = normalizeBonusKeyPrice(request.priceBonusCoins);
  if (hasAdventureItem(normalized, "golden-key"))
    return decision("reusable-key-owned", price, false, normalized);
  if (request.hasSingleUseKey)
    return decision("single-use-key-held", price, false, normalized);
  if (!normalized.campaign.completedEvents.includes(BONUS_KEY_TRIAL_EVENT)) {
    return decision(
      "trial-granted",
      price,
      true,
      completeAdventureEvent(normalized, BONUS_KEY_TRIAL_EVENT),
    );
  }
  if (normalized.economy.bonusCoins < price)
    return decision("insufficient-funds", price, false, normalized);
  return decision(
    "purchased",
    price,
    true,
    spendBonusCoins(normalized, price),
  );
}

function matchesInteraction(
  rule: AdventureInteractionRule,
  request: AdventureInteractionRequest,
): boolean {
  const selector = rule.selector;
  return (
    (selector.type === undefined || selector.type === request.objectType) &&
    (selector.x === undefined || selector.x === request.x) &&
    (selector.y === undefined || selector.y === request.y) &&
    (selector.action === undefined || selector.action === request.action) &&
    (selector.role === undefined || selector.role === request.role)
  );
}

function decision(
  outcome: BonusKeyVendorOutcome,
  priceBonusCoins: number,
  grantSingleUseKey: boolean,
  save: AdventureSave,
): BonusKeyVendorDecision {
  return { outcome, priceBonusCoins, grantSingleUseKey, save };
}

function normalizePurchasePrice(value: number): number {
  if (!Number.isFinite(value) || value < 0)
    throw new Error("Adventure 商品价格必须是非负有限数");
  return Math.floor(value);
}

function normalizeBonusKeyPrice(value: number | undefined): number {
  return value === undefined
    ? DEFAULT_SINGLE_USE_LOCK_KEY_PRICE_BONUS_COINS
    : normalizePurchasePrice(value);
}

function purchaseDecision(
  outcome: AdventureItemPurchaseOutcome,
  save: AdventureSave,
  item: AdventureItemId,
  currency: AdventurePurchaseCurrency,
  price: number,
): AdventureItemPurchaseDecision {
  return { outcome, item, currency, price, save };
}
