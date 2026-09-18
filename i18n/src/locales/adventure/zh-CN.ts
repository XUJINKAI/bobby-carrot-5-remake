const catalog = {
  "adventure.homeAria": "冒险模式",
  "adventure.homeTitle": "冒险模式",
  "adventure.continue": "继续冒险",
  "adventure.chapters": "章节选择",
  "adventure.chaptersDescription": "选择章节与已解锁关卡",
  "adventure.shop": "海狸商店",
  "adventure.shopDescription": "购买全局物品，当前金币数：{coins}",
  "adventure.nightTrain": "夜间列车",
  "adventure.nightTrainDescription": "Dream Machine · Cloud 9 · Dreamland Reward",
  "adventure.difficulty": "章节难度 {count} 星",
  "adventure.bonusKey.permanentOwned": "你的永久钥匙可以直接打开这把锁。",
  "adventure.bonusKey.lockKeyHeld": "你已经带着一把关卡钥匙了。",
  "adventure.bonusKey.trialGranted": "第一次免费送你一把体验钥匙。找到锁以后，倒计时才会开始！",
  "adventure.bonusKey.purchased": "成交！这把钥匙只够开一次锁。",
  "adventure.bonusKey.insufficient": "Bonus Coin 不足；这把关卡钥匙需要 {price} 枚。",
} as const;
export type AdventureTranslationKey = keyof typeof catalog;
export default catalog;