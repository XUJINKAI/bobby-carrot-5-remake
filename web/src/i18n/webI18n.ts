import {
  createTranslator,
  normalizeLocale,
  type Locale,
  type TranslationCatalog,
  type Translator,
} from "@bobby/i18n";

const LOCALE_STORAGE_KEY = "bobby.locale";

const WEB_CATALOGS = {
  "zh-CN": {
    "shell.music": "音乐",
    "shell.settings": "设置",
    "shell.help": "帮助",
  },
  en: {
    "shell.music": "Music",
    "shell.settings": "Settings",
    "shell.help": "Help",
  },
} satisfies Readonly<Record<Locale, TranslationCatalog>>;

export type WebTranslationKey = keyof (typeof WEB_CATALOGS)["zh-CN"];

let translator: Translator | null = null;

export function resolvePreferredLocale(
  storedLocale: string | null | undefined,
  browserLocales: readonly string[],
): Locale {
  const stored = normalizeLocale(storedLocale);
  if (stored) return stored;

  for (const candidate of browserLocales) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return "en";
}

export function initializeWebI18n(): Locale {
  const browserLocales = navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  const locale = resolvePreferredLocale(
    localStorage.getItem(LOCALE_STORAGE_KEY),
    browserLocales,
  );
  ensureTranslator().setLocale(locale);
  document.documentElement.lang = locale;
  return locale;
}

export function getWebLocale(): Locale {
  return ensureTranslator().locale;
}

export function setWebLocale(locale: Locale): void {
  ensureTranslator().setLocale(locale);
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

export function webT(key: WebTranslationKey): string {
  return ensureTranslator().t(key);
}

function ensureTranslator(): Translator {
  translator ??= createTranslator({
    locale: "zh-CN",
    fallbackLocale: "zh-CN",
    catalogs: WEB_CATALOGS,
  });
  return translator;
}
