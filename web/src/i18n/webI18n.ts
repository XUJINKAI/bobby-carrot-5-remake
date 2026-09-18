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
const CORE_SCOPES = new Set<TranslationScope>(["shell"]);
const locale = ref<Locale>(FALLBACK_LOCALE);
const translator = createTranslator({
  locale: FALLBACK_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
});
const routeScopes = new Set<TranslationScope>();
const transientScopes = new Map<TranslationScope, number>();
let localeGeneration = 0;
let desiredLocale: Locale = FALLBACK_LOCALE;

export type WebTranslationKey = TranslationKey;
export type WebI18nScopeLease = () => void;

export function resolveBrowserLocale(browserLocales: readonly string[]): Locale {
  for (const candidate of browserLocales) {
    const resolved = normalizeLocale(candidate);
    if (resolved) return resolved;
  }
  return "en";
}

export async function initializeWebI18n(initialLocale: Locale): Promise<Locale> {
  desiredLocale = initialLocale;
  await loadScopes(CORE_SCOPES, initialLocale);
  translator.setLocale(initialLocale);
  locale.value = initialLocale;
  if (typeof document !== "undefined") document.documentElement.lang = initialLocale;
  return initialLocale;
}

export function getWebLocale(): Locale {
  return locale.value;
}

export function beginWebI18nRoute(): void {
  routeScopes.clear();
}

export async function setWebLocale(nextLocale: Locale): Promise<void> {
  if (nextLocale === desiredLocale) return;
  desiredLocale = nextLocale;
  const generation = ++localeGeneration;
  await loadScopes(activeScopes(), nextLocale);
  if (generation !== localeGeneration || nextLocale !== desiredLocale) return;
  translator.setLocale(nextLocale);
  locale.value = nextLocale;
  if (typeof document !== "undefined") document.documentElement.lang = nextLocale;
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("web-locale-change", { detail: nextLocale }),
    );
}

export async function ensureWebI18nScopes(
  scopes: readonly TranslationScope[],
  targetLocale: Locale = locale.value,
): Promise<void> {
  for (const scope of scopes) routeScopes.add(scope);
  await loadScopesForCurrentRequest(scopes, targetLocale);
}

export async function acquireWebI18nScopes(
  scopes: readonly TranslationScope[],
  targetLocale: Locale = locale.value,
): Promise<WebI18nScopeLease> {
  for (const scope of scopes)
    transientScopes.set(scope, (transientScopes.get(scope) ?? 0) + 1);
  try {
    await loadScopesForCurrentRequest(scopes, targetLocale);
  } catch (error) {
    releaseTransientScopes(scopes);
    throw error;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseTransientScopes(scopes);
  };
}

export function webT(
  key: WebTranslationKey,
  params?: TranslationParams,
): string {
  locale.value;
  return translator.t(key, params);
}

function activeScopes(): Set<TranslationScope> {
  return new Set([
    ...CORE_SCOPES,
    ...routeScopes,
    ...transientScopes.keys(),
  ]);
}

async function loadScopesForCurrentRequest(
  scopes: readonly TranslationScope[],
  targetLocale: Locale,
): Promise<void> {
  const locales = new Set<Locale>([targetLocale]);
  if (desiredLocale !== targetLocale) locales.add(desiredLocale);
  await Promise.all(
    [...locales].flatMap((candidate) =>
      scopes.map((scope) => loadAndRegister(scope, candidate)),
    ),
  );
}

async function loadScopes(
  scopes: Iterable<TranslationScope>,
  targetLocale: Locale,
): Promise<void> {
  await Promise.all(
    [...scopes].map((scope) => loadAndRegister(scope, targetLocale)),
  );
}

function releaseTransientScopes(scopes: readonly TranslationScope[]): void {
  for (const scope of scopes) {
    const count = transientScopes.get(scope) ?? 0;
    if (count <= 1) transientScopes.delete(scope);
    else transientScopes.set(scope, count - 1);
  }
}

async function loadAndRegister(
  scope: TranslationScope,
  targetLocale: Locale,
): Promise<void> {
  const catalog = await loadTranslationCatalog(scope, targetLocale);
  translator.registerCatalog(targetLocale, catalog);
}
