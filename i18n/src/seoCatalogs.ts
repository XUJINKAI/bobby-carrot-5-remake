import type { Locale } from "./index.js";
import seoZhCN, { type SeoTranslationKey } from "./locales/seo/zh-CN.js";
import seoEn from "./locales/seo/en.js";

export type { SeoTranslationKey };

export const SEO_CATALOGS = {
  "zh-CN": seoZhCN,
  en: seoEn,
} satisfies Readonly<Record<Locale, Readonly<Record<SeoTranslationKey, string>>>>;
