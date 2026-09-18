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
let routeScopes = new Set<TranslationScope>();
const transientScopes = new Map<TranslationScope, number>();
let localeGeneration = 0;
let desiredLocale: Locale = FALLBACK_LOCALE;
let localeTransition: { locale: Locale; promise: Promise<void> } | null = null;

export type WebTranslationKey = TranslationKey;

export interface WebLocalizedText {
  readonly key: WebTranslationKey;
  readonly params?: TranslationParams;
}

export type WebDisplayText = string | WebLocalizedText;

export interface WebI18nScope {
  readonly ready: Promise<void>;
  readonly active: boolean;
  dispose(): void;
}

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

export function setWebLocale(nextLocale: Locale): Promise<void> {
  if (nextLocale === locale.value && nextLocale === desiredLocale)
    return Promise.resolve();
  if (localeTransition?.locale === nextLocale)
    return localeTransition.promise;

  desiredLocale = nextLocale;
  const generation = ++localeGeneration;
  const promise = (async (): Promise<void> => {
    await loadScopes(activeScopes(), nextLocale);
    if (generation !== localeGeneration || nextLocale !== desiredLocale) return;
    translator.setLocale(nextLocale);
    locale.value = nextLocale;
    if (typeof document !== "undefined")
      document.documentElement.lang = nextLocale;
    if (typeof window !== "undefined")
      window.dispatchEvent(
        new CustomEvent("web-locale-change", { detail: nextLocale }),
      );
  })();

  localeTransition = { locale: nextLocale, promise };
  const clearTransition = (): void => {
    if (localeTransition?.promise === promise) localeTransition = null;
  };
  void promise.then(clearTransition, clearTransition);
  return promise;
}

export async function preloadWebI18nScopes(
  scopes: readonly TranslationScope[],
): Promise<void> {
  await loadScopesForDesiredLocale(scopes);
}

export function setWebI18nRouteScopes(
  scopes: readonly TranslationScope[],
): void {
  routeScopes = new Set(scopes);
}

export function openWebI18nScope(
  scopes: readonly TranslationScope[],
): WebI18nScope {
  const ownedScopes = [...new Set(scopes)];
  for (const scope of ownedScopes)
    transientScopes.set(scope, (transientScopes.get(scope) ?? 0) + 1);

  let active = true;
  const ready = loadScopesForDesiredLocale(ownedScopes).catch((error) => {
    if (active) {
      active = false;
      releaseTransientScopes(ownedScopes);
    }
    throw error;
  });

  return {
    get active(): boolean {
      return active;
    },
    ready,
    dispose(): void {
      if (!active) return;
      active = false;
      releaseTransientScopes(ownedScopes);
    },
  };
}

export function webT(
  key: WebTranslationKey,
  params?: TranslationParams,
): string {
  locale.value;
  return translator.t(key, params);
}

export function localizedText(
  key: WebTranslationKey,
  params?: TranslationParams,
): WebLocalizedText {
  return params ? { key, params } : { key };
}

export function resolveWebText(value: WebDisplayText): string {
  return typeof value === "string" ? value : webT(value.key, value.params);
}

function activeScopes(): Set<TranslationScope> {
  return new Set([
    ...CORE_SCOPES,
    ...routeScopes,
    ...transientScopes.keys(),
  ]);
}

async function loadScopesForDesiredLocale(
  scopes: readonly TranslationScope[],
): Promise<void> {
  while (true) {
    const targetLocale = desiredLocale;
    await loadScopes(scopes, targetLocale);
    if (targetLocale === desiredLocale) return;
  }
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
