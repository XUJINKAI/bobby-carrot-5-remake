const catalog = {
  "collections.original.name": "兔子波比5",
  "collections.original.tag": "原版关卡",
  "collections.original.description":
    "原版 400 个普通关卡、80 个 Bonus 奖励关及 5 个特殊场景。",

  "collections.robo2.name": "Robo 2",
  "collections.robo2.tag": "激光解谜",
  "collections.robo2.description":
    "HeroCraft 2004 年 J2ME 益智游戏的 25 张内置关卡。",

  "collections.novoban-pushbox.name": "Novoban",
  "collections.novoban-pushbox.tag": "推箱子",
  "collections.novoban-pushbox.description":
    "François Marques 的 50 张入门 Sokoban 关卡，难度逐渐增加。",

  "collections.loma-pushbox.name": "LOMA",
  "collections.loma-pushbox.tag": "推箱子",
  "collections.loma-pushbox.description":
    "Levels Of Many Authors：137 张三箱 Sokoban 地图。",

  "collections.engine-lab.name": "Engine Lab",
  "collections.engine-lab.tag": "引擎实验室",
  "collections.engine-lab.description": "用于实验 Engine 新机制的扩展地图。",

  "collections.original-patch.name": "Original Patch",
  "collections.original-patch.tag": "原版验证",
  "collections.original-patch.description":
    "用于生成原版 JAR 验证包的机制测试地图。",
} as const;

export type CollectionTranslationKey = keyof typeof catalog;
export default catalog;
