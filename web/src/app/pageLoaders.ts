import type { TranslationScope } from "@bobby/i18n";
import { preloadWebI18nScopes } from "../i18n/webI18n.js";

export interface LocalizedPageLoader<T> {
  (): Promise<T>;
  readonly scopes: readonly TranslationScope[];
}

export function localizedPageScopes(
  ...loaders: LocalizedPageLoader<unknown>[]
): TranslationScope[] {
  return [...new Set(loaders.flatMap((loader) => loader.scopes))];
}

function createLocalizedPageLoader<T>(
  scopes: readonly TranslationScope[],
  importer: () => Promise<T>,
): LocalizedPageLoader<T> {
  const load = async (): Promise<T> => {
    const [page] = await Promise.all([
      importer(),
      preloadWebI18nScopes(scopes),
    ]);
    return page;
  };
  return Object.assign(load, { scopes });
}

export const loadHomePage = createLocalizedPageLoader(
  ["home"],
  () => import("../pages/home/mountHomePage.js"),
);

export const loadExplorePage = createLocalizedPageLoader(
  ["explore"],
  () => import("../pages/explore/mountExplorePage.js"),
);

export const loadAdventurePages = createLocalizedPageLoader(
  ["adventure"],
  () => import("../pages/adventure/mountAdventurePages.js"),
);

export const loadGamePage = createLocalizedPageLoader(
  ["game"],
  () => import("../pages/game/mountGamePage.js"),
);

export const loadEditorPage = createLocalizedPageLoader(
  ["editor", "game"],
  () => import("../pages/editor/mountEditorPage.js"),
);

export const loadSettingsPage = createLocalizedPageLoader(
  ["settings"],
  () => import("../pages/settings/mountSettingsPage.js"),
);

export const loadImportPage = createLocalizedPageLoader(
  ["import"],
  () => import("../pages/import/mountImportPage.js"),
);

export const loadEmbedPage = createLocalizedPageLoader(
  ["embed"],
  () => import("../pages/embed/mountEmbedPage.js"),
);
