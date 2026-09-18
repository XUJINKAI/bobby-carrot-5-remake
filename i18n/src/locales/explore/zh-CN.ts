const catalog = {
  "explore.tabsAria": "自由探索地图集合",
  "explore.levelCount": "{count} 关",
  "explore.random": "随机关卡",
  "explore.continue": "继续游玩 · {label}",
  "explore.filtersAria": "关卡筛选",
  "explore.filter": "筛选",
  "explore.clearFilters": "清除筛选",
  "explore.filterStatus": "匹配 {count} 张地图；已选条件需同时满足。",
  "explore.filterHint": "所有已选条件需同时满足。",
  "explore.filterEmpty": "没有符合这些条件的地图。",
} as const;
export type ExploreTranslationKey = keyof typeof catalog;
export default catalog;