import { createOriginalGameplayImageManager } from "@bobby/engine";
import type { Locale } from "@bobby/i18n";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { PROJECT_REPOSITORY_URL } from "../../app/pageChrome.js";
import { initializeWebI18n, setWebI18nRouteScopes } from "../../i18n/webI18n.js";
import HomePage from "./HomePage.vue";
import { createHomeViewState } from "./homeViewState.js";

/** 构建流程按语言顺序调用；Canvas 与输入在浏览器 mounted 后启动。 */
export async function prerenderHome(locale: Locale): Promise<string> {
  await initializeWebI18n(locale);
  await setWebI18nRouteScopes(["home"]);
  const images = createOriginalGameplayImageManager(
    (file) => `/assets/art/hd/${file}`,
  );
  try {
    return await renderToString(createSSRApp(HomePage, {
      state: createHomeViewState(),
      images,
      repositoryUrl: PROJECT_REPOSITORY_URL,
    }));
  } finally {
    images.destroy();
  }
}
