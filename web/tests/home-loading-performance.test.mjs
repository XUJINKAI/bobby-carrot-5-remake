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
