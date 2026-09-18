import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("Home 首屏按路由加载页面代码和非关键数据", async () => {
  const [app, entry, loaders] = await Promise.all([
    readFile(new URL("../src/app/BobbyApp.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/pageLoaders.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(app, /from ["']\.\.\/pages\//);
  assert.match(app, /loadHomePage\(\)/);
  assert.match(loaders, /home:\s*definePage\([\s\S]*\["home"\][\s\S]*mountHomePage\.js/);
  assert.match(loaders, /loadHomePage = createLocalizedPageLoader\(PAGE_REGISTRY\.home\)/);
  assert.match(app, /scheduleHomePrefetch\(\)/);
  assert.match(app, /prefetchMaps\(/);
  assert.doesNotMatch(app, /images\.preload\(\)/);
  assert.doesNotMatch(entry, /editor\.css/);
  assert.doesNotMatch(entry, /await app\.start\(\)/);
  assert.match(entry, /void app\.start\(\)/);
});

test("Editor 样式按页面加载，Help 文案改为 i18n lazy scope", async () => {
  const [editorMount, appRoot, catalogs] = await Promise.all([
    readFile(
      new URL("../src/pages/editor/mountEditorPage.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/app/AppRoot.vue", import.meta.url), "utf8"),
    readFile(new URL("../../i18n/src/catalogs.ts", import.meta.url), "utf8"),
  ]);

  assert.match(editorMount, /editor\/style\.css/);
  assert.match(appRoot, /openWebI18nScope\(\["help"\]\)/);
  assert.match(catalogs, /help:[\s\S]*import\("\.\/locales\/help\/zh-CN\.js"\)/);
  assert.match(catalogs, /help:[\s\S]*import\("\.\/locales\/help\/en\.js"\)/);
});


test("语言切换只重本地化当前页面，不重建 route runtime", async () => {
  const [app, contracts, editor] = await Promise.all([
    readFile(new URL("../src/app/BobbyApp.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/pageContracts.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/editor/EditorPage.vue", import.meta.url), "utf8"),
  ]);

  assert.match(contracts, /localeChanged\?\(\): void/);
  assert.match(app, /onLocaleChange[\s\S]*this\.controller\.localeChanged\?\.\(\)/);
  const localeHandler = app.match(/private readonly onLocaleChange[\s\S]*?\n  };/)?.[0] ?? "";
  assert.doesNotMatch(localeHandler, /renderRoute\(/);
  assert.match(editor, /getWebLocale\(\)/);
});

test("Home Save 导入按需加载 import scope", async () => {
  const source = await readFile(
    new URL("../src/pages/home/HomeModeMenu.vue", import.meta.url),
    "utf8",
  );
  assert.match(source, /openWebI18nScope\(\["import"\]\)/);
});

test("运行时 SEO 响应语言变化且静态 metadata 提供双语 fallback", async () => {
  const [seo, html] = await Promise.all([
    readFile(new URL("../src/seo/runtimeSeo.ts", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
  ]);
  assert.match(seo, /addEventListener\("web-locale-change", sync\)/);
  assert.match(seo, /getWebLocale\(\) === "en"/);
  assert.match(html, /兔子波比5重制版 \| Bobby Carrot 5 Remake/);
  assert.match(html, /A modern web remake of Bobby Carrot 5/);
});


test("页面模块与 i18n scope 通过统一 loader 绑定", async () => {
  const [app, loaders, i18n] = await Promise.all([
    readFile(new URL("../src/app/BobbyApp.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/pageLoaders.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/i18n/webI18n.ts", import.meta.url), "utf8"),
  ]);

  assert.match(loaders, /game:\s*definePage\([\s\S]*\["game"\][\s\S]*mountGamePage\.js/);
  assert.match(loaders, /editor:\s*definePage\([\s\S]*\["editor", "game"\][\s\S]*mountEditorPage\.js/);
  assert.doesNotMatch(app, /import\("\.\.\/pages\/game\/mountGamePage\.js"\)/);
  assert.match(app, /loadGamePage\(\)/);
  assert.match(loaders, /preloadWebI18nScopes\(scopes\)/);
  assert.match(loaders, /readonly scopes: readonly TranslationScope\[\]/);
  assert.match(i18n, /setWebI18nRouteScopes/);
  assert.match(i18n, /openWebI18nScope/);
  assert.match(i18n, /transientScopes = new Map/);
  assert.match(app, /setWebI18nRouteScopes\(localizedPageScopes/);
  assert.doesNotMatch(app, /beginWebI18nRoute/);
});


test("Adventure special scene 与 locale 设置都服从统一 i18n 流程", async () => {
  const [app, settings] = await Promise.all([
    readFile(new URL("../src/app/BobbyApp.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/settings/useGlobalSettings.ts", import.meta.url), "utf8"),
  ]);

  const sceneRenderer =
    app.match(/private async renderAdventureScene[\s\S]*?\n  }\n\n  private activateI18nRoute/)?.[0] ?? "";
  assert.match(sceneRenderer, /loadGamePage\(\)/);
  assert.doesNotMatch(sceneRenderer, /ensureWebI18nScopes/);
  assert.match(
    settings,
    /await setWebLocale\(locale\);\s+if \(getWebLocale\(\) !== locale\) return;\s+updateWebSettings/,
  );
});


test("route rendering serializes commits and lets the router own active i18n scopes", async () => {
  const app = await readFile(new URL("../src/app/BobbyApp.ts", import.meta.url), "utf8");
  assert.match(app, /private routeGeneration = 0/);
  assert.match(app, /private routeRenderQueue: Promise<void> = Promise\.resolve\(\)/);
  assert.match(app, /this\.routeRenderQueue = this\.routeRenderQueue\.then\(render, render\)/);
  assert.match(app, /if \(generation !== this\.routeGeneration\) return/);
  assert.match(app, /activateI18nRoute\(loadAdventurePages, loadGamePage\)/);
});
