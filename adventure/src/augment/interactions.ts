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
  AdventureItemPurchaseOutcome,
  AdventurePurchaseCurrency,
} from "./types.js";

export const BONUS_KEY_TRIAL_EVENT = "bonus-key-trial";
export const DEFAULT_LOCK_KEY_PRICE_BONUS_COINS = 3;

export type BonusKeyVendorOutcome =
  | "permanent-key-owned"
  | "lock-key-held"
  | "trial-granted"
  | "purchased"
  | "insufficient-funds";

export interface BonusKeyVendorDecision {
  outcome: BonusKeyVendorOutcome;
  priceBonusCoins: number;
  grantLockKey: boolean;
  save: AdventureSave;
}

export interface BonusKeyVendorRequest {
  lockKeyCount: number;
  priceBonusCoins?: number;
}

export interface AdventureItemPurchaseDecision {
  outcome: AdventureItemPurchaseOutcome;
  item: AdventureItemId;
  currency: AdventurePurchaseCurrency;
  price: number;
  save: AdventureSave;
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
  if (balance < cost) {
    return purchaseDecision(
      "insufficient-funds",
      normalized,
      item,
      currency,
      cost,
    );
  }
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

/** Campaign 经济只在 Adventure Save 上归约；Engine 只接收最终钥匙动作。 */
export function resolveBonusKeyVendorInteraction(
  save: AdventureSave,
  request: BonusKeyVendorRequest,
): BonusKeyVendorDecision {
  const normalized = normalizeAdventureSave(save);
  const price = normalizeBonusKeyPrice(request.priceBonusCoins);
  if (hasAdventureItem(normalized, "golden-key"))
    return decision("permanent-key-owned", price, false, normalized);
  if (request.lockKeyCount > 0)
    return decision("lock-key-held", price, false, normalized);
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

function decision(
  outcome: BonusKeyVendorOutcome,
  priceBonusCoins: number,
  grantLockKey: boolean,
  save: AdventureSave,
): BonusKeyVendorDecision {
  return { outcome, priceBonusCoins, grantLockKey, save };
}

function normalizePurchasePrice(value: number): number {
  if (!Number.isFinite(value) || value < 0)
    throw new Error("Adventure 商品价格必须是非负有限数");
  return Math.floor(value);
}

function normalizeBonusKeyPrice(value: number | undefined): number {
  return value === undefined
    ? DEFAULT_LOCK_KEY_PRICE_BONUS_COINS
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
