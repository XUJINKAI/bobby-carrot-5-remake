import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import { loadTranslationCatalog } from "@bobby/i18n";

test("Help 文案集中在 i18n 并提供中英文", async () => {
  const [zh, en] = await Promise.all([
    loadTranslationCatalog("help", "zh-CN"),
    loadTranslationCatalog("help", "en"),
  ]);
  assert.match(zh["help.html"], /<h2>游戏<\/h2>/);
  assert.match(
    zh["help.html"],
    /<li><strong>滑动屏幕\/方向键\/WASD<\/strong>: 控制移动<\/li>/,
  );
  assert.match(zh["help.html"], /<h2>Editor<\/h2>/);
  assert.match(zh["help.html"], /<h2>通用<\/h2>\s*<ul>\s*<li><strong>M<\/strong>：音乐开关<\/li>/);
  assert.match(en["help.html"], /<h2>Game<\/h2>/);
  assert.match(
    en["help.html"],
    /<li><strong>Swipe screen \/ Arrow keys \/ WASD<\/strong>: Move<\/li>/,
  );
  assert.match(en["help.html"], /<h2>General<\/h2>\s*<ul>\s*<li><strong>M<\/strong>: Toggle music<\/li>/);
  assert.match(en["help.html"], /<strong>Ctrl\+Z<\/strong>/);
});

test("Help 只在打开时加载对应 scope", async () => {
  const source = await readFile(
    new URL("../../../web/src/app/AppRoot.vue", import.meta.url),
    "utf8",
  );
  assert.match(source, /openWebI18nScope\(\["help"\]\)/);
  assert.match(source, /webT\("help\.html"\)/);
  assert.match(source, /event\.key\.toLowerCase\(\) !== "m"/);
  assert.match(source, /settings\.toggleMusic\(\)/);
  assert.match(source, /window\.addEventListener\("keydown", handleGlobalKeydown\)/);
  assert.match(source, /window\.removeEventListener\("keydown", handleGlobalKeydown\)/);
});

test("页面配置不维护完整快捷键清单", async () => {
  const pageSources = await Promise.all([
    "../../../web/src/app/pageChrome.ts",
    "../../../web/src/pages/editor/editorShell.ts",
    "../../../web/src/pages/game/mountGamePage.ts",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const source = pageSources.join("\n");

  assert.doesNotMatch(source, /BROWSE_HELP|GAME_HELP|EDITOR_HELP/);
  assert.doesNotMatch(source, /录制 Replay 测试输入（Tab）/);
  assert.doesNotMatch(source, /方向键 \/ WASD 移动/);
});


test("lazy i18n scope readiness covers both rendered and requested locales", async () => {
  const source = await readFile(
    new URL("../../../web/src/i18n/webI18n.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /const currentLocale = locale\.value;/);
  assert.match(source, /const targetLocale = desiredLocale;/);
  assert.match(
    source,
    /Promise\.all\(\[\s*loadScopes\(scopes, currentLocale\),[\s\S]*loadScopes\(scopes, targetLocale\)/,
  );
  assert.match(
    source,
    /currentLocale === locale\.value[\s\S]*targetLocale === desiredLocale/,
  );
  assert.match(
    source,
    /export async function setWebI18nRouteScopes[\s\S]*await loadScopesForRender\(scopes\)/,
  );
});

test("route i18n activation keeps stale-route protection across awaits", async () => {
  const source = await readFile(
    new URL("../../../web/src/app/BobbyApp.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /private async activateI18nRoute\([\s\S]*if \(!this\.canCommitRoute\(generation\)\) return false;[\s\S]*await setWebI18nRouteScopes[\s\S]*return this\.canCommitRoute\(generation\)/,
  );
  assert.match(
    source,
    /if \(!\(await this\.activateI18nRoute\(generation, loadGamePage\)\)\) return;/,
  );
});
