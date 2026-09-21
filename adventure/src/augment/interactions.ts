import {
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

function normalizePurchasePrice(value: number): number {
  if (!Number.isFinite(value) || value < 0)
    throw new Error("Adventure 商品价格必须是非负有限数");
  return Math.floor(value);
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
