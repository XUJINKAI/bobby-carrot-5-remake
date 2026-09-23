const catalog = {
  "collections.original.name": "兔子波比5",
  "collections.original.tag": "原版关卡",
  "collections.original.description":
    "原版 400 个普通关卡、80 个 Bonus 奖励关及 5 个特殊场景。",
  "collections.original.filters.targets.name": "目标",
  "collections.original.filters.targets.options.carrot": "萝卜",
  "collections.original.filters.targets.options.egg": "彩蛋",
  "collections.original.filters.target-count.name": "目标数",
  "collections.original.filters.target-count.options.0-10": "0-10",
  "collections.original.filters.target-count.options.11-20": "11-20",
  "collections.original.filters.target-count.options.21-40": "21-40",
  "collections.original.filters.target-count.options.41-60": "41-60",
  "collections.original.filters.target-count.options.61+": "61+",
  "collections.original.filters.scenes.name": "场景",
  "collections.original.filters.scenes.options.grassland": "草地",
  "collections.original.filters.scenes.options.water": "水域",
  "collections.original.filters.scenes.options.snow": "雪地",
  "collections.original.filters.scenes.options.starfield": "星空",
  "collections.original.filters.scenes.options.desert": "沙漠",
  "collections.original.filters.mechanics.name": "道具与机关",
  "collections.original.filters.mechanics.options.speed": "加速带",
  "collections.original.filters.mechanics.options.mower": "割草机/高草",
  "collections.original.filters.mechanics.options.highgrass": "高草",
  "collections.original.filters.mechanics.options.crumblyrock": "易碎岩石",
  "collections.original.filters.mechanics.options.bean": "魔豆",
  "collections.original.filters.mechanics.options.shovel": "雪铲/积雪",
  "collections.original.filters.mechanics.options.kite": "风筝/龙卷风",
  "collections.original.filters.mechanics.options.tide": "潮汐",
  "collections.original.filters.mechanics.options.leaf": "叶子",
  "collections.original.filters.mechanics.options.color": "彩色方块",
  "collections.original.filters.mechanics.options.carousel": "旋转通道",
  "collections.original.filters.mechanics.options.dragon": "龙/镜子/冰块",
  "collections.original.filters.mechanics.options.wind": "风车/云",
  "collections.original.filters.mechanics.options.trap": "陷阱",
  "collections.original.filters.mechanics.options.plank": "木板",

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
