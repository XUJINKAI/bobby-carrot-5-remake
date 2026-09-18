const catalog = {
  "help.game": "游戏",
  "help.general": "通用",
  "help.about": "关于",
  "help.repository": "GitHub 仓库",
} as const;
export type HelpTranslationKey = keyof typeof catalog;
export default catalog;