import type { Locale, TranslationCatalog } from "./index.js";
import { createCatalogStore } from "./catalogStore.js";
import embedRuntimeZhCN from "./locales/embed-runtime/zh-CN.js";
import embedRuntimeEn from "./locales/embed-runtime/en.js";
import type { ShellTranslationKey } from "./locales/shell/zh-CN.js";
import type { HomeTranslationKey } from "./locales/home/zh-CN.js";
import type { ExploreTranslationKey } from "./locales/explore/zh-CN.js";
import type { AdventureTranslationKey } from "./locales/adventure/zh-CN.js";
import type { GameTranslationKey } from "./locales/game/zh-CN.js";
import type { EditorTranslationKey } from "./locales/editor/zh-CN.js";
import type { SettingsTranslationKey } from "./locales/settings/zh-CN.js";
import type { ImportTranslationKey } from "./locales/import/zh-CN.js";
import type { EmbedTranslationKey } from "./locales/embed/zh-CN.js";
import type { HelpTranslationKey } from "./locales/help/zh-CN.js";

export type TranslationScope =
  | "shell"
  | "home"
  | "explore"
  | "adventure"
  | "game"
  | "editor"
  | "settings"
  | "import"
  | "embed"
  | "help";

export type TranslationKey =
  | ShellTranslationKey
  | HomeTranslationKey
  | ExploreTranslationKey
  | AdventureTranslationKey
  | GameTranslationKey
  | EditorTranslationKey
  | SettingsTranslationKey
  | ImportTranslationKey
  | EmbedTranslationKey
  | HelpTranslationKey;

type CatalogLoader = () => Promise<TranslationCatalog>;

const LOADERS: Record<TranslationScope, Record<Locale, CatalogLoader>> = {
  shell: {
    "zh-CN": () => import("./locales/shell/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/shell/en.js").then((m) => m.default),
  },
  home: {
    "zh-CN": () => import("./locales/home/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/home/en.js").then((m) => m.default),
  },
  explore: {
    "zh-CN": () => import("./locales/explore/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/explore/en.js").then((m) => m.default),
  },
  adventure: {
    "zh-CN": () => import("./locales/adventure/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/adventure/en.js").then((m) => m.default),
  },
  game: {
    "zh-CN": () => import("./locales/game/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/game/en.js").then((m) => m.default),
  },
  editor: {
    "zh-CN": () => import("./locales/editor/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/editor/en.js").then((m) => m.default),
  },
  settings: {
    "zh-CN": () => import("./locales/settings/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/settings/en.js").then((m) => m.default),
  },
  import: {
    "zh-CN": () => import("./locales/import/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/import/en.js").then((m) => m.default),
  },
  embed: {
    "zh-CN": () => import("./locales/embed/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/embed/en.js").then((m) => m.default),
  },
  help: {
    "zh-CN": () => import("./locales/help/zh-CN.js").then((m) => m.default),
    en: () => import("./locales/help/en.js").then((m) => m.default),
  },
};

const catalogStore = createCatalogStore<string, TranslationCatalog>();

export function loadTranslationCatalog(
  scope: TranslationScope,
  locale: Locale,
): Promise<TranslationCatalog> {
  return catalogStore.load(
    `${scope}:${locale}`,
    LOADERS[scope][locale],
  );
}

export const EMBED_RUNTIME_CATALOGS = {
  "zh-CN": embedRuntimeZhCN,
  en: embedRuntimeEn,
} satisfies Readonly<Record<Locale, TranslationCatalog>>;
