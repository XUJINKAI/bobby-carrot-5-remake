const catalog = {
  "settings.saveTitle": "存档管理",
  "settings.saveDescription": "导入、复制或下载此浏览器中已有的游戏存档。",
  "settings.savesAria": "游戏存档",
  "settings.completed": "{count} 已完成",
  "settings.recent": "最近 {map}",
  "settings.adventureDescription": "Campaign 进度、Bonus Coin 和 Golden Carrot。",
  "settings.exploreDescription": "{collection} 地图集合的完成记录和最近游玩位置。",
  "settings.adventureImported": "Adventure 存档已导入。",
  "settings.exploreImported": "{label} 存档已导入。",
  "settings.adventureImportNote": "导入会覆盖当前 Adventure 存档。",
  "settings.exploreImportNote": "导入会覆盖 {collection} 地图集合的 Explore 存档。",
  "settings.adventurePlaceholder": "粘贴 Adventure Save JSON、BC5R 文本或分享链接……",
  "settings.explorePlaceholder": "粘贴 Explore Collection Save JSON、BC5R 文本或分享链接……",
  "settings.emptyTitle": "暂无游戏存档",
  "settings.emptyDescription": "游玩 Adventure 或 Explore 后，对应存档会显示在这里。",
} as const;
export type SettingsTranslationKey = keyof typeof catalog;
export default catalog;