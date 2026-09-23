import type { Locale } from "./index.js";
import collectionZhCN, {
  type CollectionTranslationKey,
} from "./locales/collections/zh-CN.js";
import collectionEn from "./locales/collections/en.js";

export type { CollectionTranslationKey };

export const COLLECTION_CATALOGS = {
  "zh-CN": collectionZhCN,
  en: collectionEn,
} satisfies Readonly<
  Record<Locale, Readonly<Record<CollectionTranslationKey, string>>>
>;
