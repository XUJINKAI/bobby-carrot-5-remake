const catalog = {
  "import.title": "数据导入",
  "import.raw": "查看原始数据",
  "import.home": "返回首页",
  "import.adventureIncoming": "即将导入冒险进度：",
  "import.exploreIncoming": "即将导入自由探索进度：",
  "import.completed": "已完成",
  "import.collection": "地图集合",
  "import.adventureOverwrite": "导入会覆盖当前 Adventure Save。",
  "import.exploreOverwrite": "导入会覆盖这个地图集合的 Explore Save。",
  "import.confirm": "导入并覆盖",
  "import.unknown": "无法识别这段 Bobby Carrot 5 Remake 数据。",
} as const;
export type ImportTranslationKey = keyof typeof catalog;
export default catalog;
