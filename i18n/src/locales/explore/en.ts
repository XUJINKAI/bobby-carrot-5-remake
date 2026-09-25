import type { ExploreTranslationKey } from "./zh-CN.js";
const catalog = {
  "explore.tabsAria": "Explore map collections",
  "explore.levelCount": "{count} levels",
  "explore.filteredLevelCount": "{count} / {total} levels",
  "explore.random": "Random level",
  "explore.continue": "Continue · {label}",
  "explore.filtersAria": "Level filters",
  "explore.filter": "Filter",
  "explore.clearFilters": "Clear filters",
  "explore.filterStatus": "{count} maps match; all selected conditions must match.",
  "explore.filterHint": "All selected conditions must match.",
  "explore.filterEmpty": "No maps match these conditions.",
  "explore.chapterDifficulty": "Chapter difficulty: {count} stars",
  "explore.replayAvailable": "Replay available",
  "explore.completedTitle": "Completed in Explore",
} satisfies Record<ExploreTranslationKey, string>;
export default catalog;
