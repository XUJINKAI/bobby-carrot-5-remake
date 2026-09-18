import type { AdventureTranslationKey } from "./zh-CN.js";
const catalog = {
  "adventure.homeAria": "Adventure",
  "adventure.homeTitle": "Adventure",
  "adventure.continue": "Continue Adventure",
  "adventure.chapters": "Chapter Select",
  "adventure.chaptersDescription": "Choose a chapter and unlocked level",
  "adventure.shop": "Beaver Shop",
  "adventure.shopDescription": "Buy global items · Bonus Coins: {coins}",
  "adventure.nightTrain": "Night Train",
  "adventure.nightTrainDescription": "Dream Machine · Cloud 9 · Dreamland Reward",
  "adventure.difficulty": "Chapter difficulty: {count} stars",
  "adventure.bonusKey.permanentOwned": "Your permanent key can open this lock directly.",
  "adventure.bonusKey.lockKeyHeld": "You are already carrying a level key.",
  "adventure.bonusKey.trialGranted": "Your first trial key is free. The countdown starts only after you open the lock.",
  "adventure.bonusKey.purchased": "Deal! This key opens one lock.",
  "adventure.bonusKey.insufficient": "Not enough Bonus Coins; a level key costs {price}.",
} satisfies Record<AdventureTranslationKey, string>;
export default catalog;