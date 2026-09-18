import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("Home 首屏按路由加载页面代码和非关键数据", async () => {
  const [app, entry] = await Promise.all([
    readFile(new URL("../src/app/BobbyApp.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(app, /from ["']\.\.\/pages\//);
  assert.match(app, /import\("\.\.\/pages\/home\/mountHomePage\.js"\)/);
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
  assert.match(appRoot, /ensureWebI18nScopes\(\["help"\]\)/);
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
  assert.match(source, /ensureWebI18nScopes\(\["import"\]\)/);
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
