const catalog = {
  "home.startAria": "开始游戏",
  "home.modeAria": "选择模式",
  "home.modeTitle": "选择模式",
  "home.adventure": "冒险模式",
  "home.adventureDescription": "还原原版关卡体验",
  "home.explore": "自由探索",
  "home.exploreDescription": "浏览原版与扩展地图集合",
  "home.editor": "地图编辑器",
  "home.editorDescription": "创建或编辑已有地图，并分享给他人",
  "home.import": "导入地图",
  "home.importDescription": "导入自定义地图或存档",
  "home.embed": "将自制地图内嵌到其他网页",
  "home.importDialog": "导入数据",
  "home.importOpen": "打开",
  "home.importPlaceholder": "粘贴 JSON、BC5R1 文本或分享链接……",
} as const;
export type HomeTranslationKey = keyof typeof catalog;
export default catalog;