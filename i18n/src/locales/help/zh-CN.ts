const catalog = {
  "help.title": "操作说明",
} as const;

export type HelpCopyTranslationKey = keyof typeof catalog;
export type HelpTranslationKey = HelpCopyTranslationKey | "help.html";
export default catalog;
