export type Locale = "zh-CN" | "en";

export type TranslationPrimitive = string | number;
export type TranslationParams = Readonly<Record<string, TranslationPrimitive>>;
export type TranslationValue = string | readonly string[];
export type TranslationCatalog = Readonly<Record<string, TranslationValue>>;

export interface TranslatorOptions {
  locale: Locale;
  fallbackLocale: Locale;
  catalogs?: Readonly<Partial<Record<Locale, TranslationCatalog>>>;
}

export interface Translator {
  readonly locale: Locale;
  readonly fallbackLocale: Locale;
  setLocale(locale: Locale): void;
  registerCatalog(locale: Locale, catalog: TranslationCatalog): void;
  has(key: string): boolean;
  t(key: string, params?: TranslationParams): string;
  tArray(key: string, params?: TranslationParams): readonly string[];
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replaceAll("_", "-");
  if (!normalized) return null;
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  return null;
}

export function createTranslator(options: TranslatorOptions): Translator {
  let locale = options.locale;
  const catalogs: Partial<Record<Locale, Record<string, TranslationValue>>> = {};

  for (const candidate of ["zh-CN", "en"] as const) {
    const catalog = options.catalogs?.[candidate];
    if (catalog) catalogs[candidate] = { ...catalog };
  }

  return {
    get locale(): Locale {
      return locale;
    },
    fallbackLocale: options.fallbackLocale,
    setLocale(nextLocale: Locale): void {
      locale = nextLocale;
    },
    registerCatalog(targetLocale: Locale, catalog: TranslationCatalog): void {
      catalogs[targetLocale] = {
        ...catalogs[targetLocale],
        ...catalog,
      };
    },
    has(key: string): boolean {
      return (
        catalogs[locale]?.[key] !== undefined ||
        catalogs[options.fallbackLocale]?.[key] !== undefined
      );
    },
    t(key: string, params?: TranslationParams): string {
      const template =
        catalogs[locale]?.[key] ??
        catalogs[options.fallbackLocale]?.[key] ??
        key;
      if (typeof template !== "string")
        throw new TypeError(`翻译键 ${key} 对应字符串数组`);
      return interpolate(template, params);
    },
    tArray(key: string, params?: TranslationParams): readonly string[] {
      const template =
        catalogs[locale]?.[key] ??
        catalogs[options.fallbackLocale]?.[key];
      if (!Array.isArray(template))
        throw new TypeError(`翻译键 ${key} 未对应字符串数组`);
      return template.map((line) => interpolate(line, params));
    },
  };
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{([A-Za-z0-9_.-]+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export {
  SEO_CATALOGS,
  type SeoTranslationKey,
} from "./seoCatalogs.js";

export {
  COLLECTION_CATALOGS,
  type CollectionTranslationKey,
} from "./collectionCatalogs.js";

export {
  EMBED_RUNTIME_CATALOGS,
  loadTranslationCatalog,
  type TranslationKey,
  type TranslationArrayKey,
  type TranslationScope,
} from "./catalogs.js";
