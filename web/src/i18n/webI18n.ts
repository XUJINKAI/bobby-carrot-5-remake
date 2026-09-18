import {
  createTranslator,
  loadTranslationCatalog,
  normalizeLocale,
  type Locale,
  type TranslationKey,
  type TranslationParams,
  type TranslationScope,
} from "@bobby/i18n";
import { ref } from "vue";

const FALLBACK_LOCALE: Locale = "zh-CN";
const locale = ref<Locale>(FALLBACK_LOCALE);
const translator = createTranslator({
  locale: FALLBACK_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
});
const activeScopes = new Set<TranslationScope>();

export type WebTranslationKey = TranslationKey;

export function resolveBrowserLocale(browserLocales: readonly string[]): Locale {
  for (const candidate of browserLocales) {
    const resolved = normalizeLocale(candidate);
    if (resolved) return resolved;
  }
  return "en";
}

export async function initializeWebI18n(initialLocale: Locale): Promise<Locale> {
  await ensureWebI18nScopes(["shell"], initialLocale);
  translator.setLocale(initialLocale);
  locale.value = initialLocale;
  document.documentElement.lang = initialLocale;
  return initialLocale;
}

export function getWebLocale(): Locale {
  return locale.value;
}

export async function setWebLocale(nextLocale: Locale): Promise<void> {
  if (nextLocale === locale.value) return;
  await Promise.all(
    [...activeScopes].map((scope) => loadAndRegister(scope, nextLocale)),
  );
  translator.setLocale(nextLocale);
  locale.value = nextLocale;
  document.documentElement.lang = nextLocale;
  window.dispatchEvent(
    new CustomEvent("web-locale-change", { detail: nextLocale }),
  );
}

export async function ensureWebI18nScopes(
  scopes: readonly TranslationScope[],
  targetLocale: Locale = locale.value,
): Promise<void> {
  await Promise.all(scopes.map((scope) => loadAndRegister(scope, targetLocale)));
  for (const scope of scopes) activeScopes.add(scope);
}

export function webT(
  key: WebTranslationKey,
  params?: TranslationParams,
): string {
  locale.value;
  return translator.t(key, params);
}

async function loadAndRegister(
  scope: TranslationScope,
  targetLocale: Locale,
): Promise<void> {
  const catalog = await loadTranslationCatalog(scope, targetLocale);
  translator.registerCatalog(targetLocale, catalog);
}
