import type { TranslationScope } from "@bobby/i18n";
import { preloadWebI18nScopes } from "../i18n/webI18n.js";

interface PageDefinition<T> {
  readonly scopes: readonly TranslationScope[];
  readonly importer: () => Promise<T>;
}

export interface LocalizedPageLoader<T> {
  (): Promise<T>;
  readonly scopes: readonly TranslationScope[];
}

function definePage<T>(
  scopes: readonly TranslationScope[],
  importer: () => Promise<T>,
): PageDefinition<T> {
  return { scopes, importer };
}

export const PAGE_REGISTRY = {
  home: definePage(
    ["home"],
    () => import("../pages/home/mountHomePage.js"),
  ),
  explore: definePage(
    ["explore"],
    () => import("../pages/explore/mountExplorePage.js"),
  ),
  adventure: definePage(
    ["adventure"],
    () => import("../pages/adventure/mountAdventurePages.js"),
  ),
  game: definePage(
    ["game"],
    () => import("../pages/game/mountGamePage.js"),
  ),
  editor: definePage(
    ["editor", "game"],
    () => import("../pages/editor/mountEditorPage.js"),
  ),
  settings: definePage(
    ["settings"],
    () => import("../pages/settings/mountSettingsPage.js"),
  ),
  import: definePage(
    ["import"],
    () => import("../pages/import/mountImportPage.js"),
  ),
  embed: definePage(
    ["embed"],
    () => import("../pages/embed/mountEmbedPage.js"),
  ),
} as const;

export function localizedPageScopes(
  ...loaders: LocalizedPageLoader<unknown>[]
): TranslationScope[] {
  return [...new Set(loaders.flatMap((loader) => loader.scopes))];
}

function createLocalizedPageLoader<T>(
  definition: PageDefinition<T>,
): LocalizedPageLoader<T> {
  const load = async (): Promise<T> => {
    const [page] = await Promise.all([
      definition.importer(),
      preloadWebI18nScopes(definition.scopes),
    ]);
    return page;
  };
  return Object.assign(load, { scopes: definition.scopes });
}

export const loadHomePage = createLocalizedPageLoader(PAGE_REGISTRY.home);
export const loadExplorePage = createLocalizedPageLoader(PAGE_REGISTRY.explore);
export const loadAdventurePages = createLocalizedPageLoader(
  PAGE_REGISTRY.adventure,
);
export const loadGamePage = createLocalizedPageLoader(PAGE_REGISTRY.game);
export const loadEditorPage = createLocalizedPageLoader(PAGE_REGISTRY.editor);
export const loadSettingsPage = createLocalizedPageLoader(
  PAGE_REGISTRY.settings,
);
export const loadImportPage = createLocalizedPageLoader(PAGE_REGISTRY.import);
export const loadEmbedPage = createLocalizedPageLoader(PAGE_REGISTRY.embed);
