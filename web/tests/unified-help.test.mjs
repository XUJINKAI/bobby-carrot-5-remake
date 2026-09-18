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
  assert.match(zh["help.html"], /<h2>Editor<\/h2>/);
  assert.match(en["help.html"], /<h2>Game<\/h2>/);
  assert.match(en["help.html"], /<strong>Ctrl\+Z<\/strong>/);
});

test("Help 只在打开时加载对应 scope", async () => {
  const source = await readFile(
    new URL("../src/app/AppRoot.vue", import.meta.url),
    "utf8",
  );
  assert.match(source, /ensureWebI18nScopes\(\["help"\]\)/);
  assert.match(source, /webT\("help\.html"\)/);
});

test("页面配置不维护完整快捷键清单", async () => {
  const pageSources = await Promise.all([
    "../src/app/pageChrome.ts",
    "../src/pages/editor/editorShell.ts",
    "../src/pages/game/mountGamePage.ts",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const source = pageSources.join("\n");

  assert.doesNotMatch(source, /BROWSE_HELP|GAME_HELP|EDITOR_HELP/);
  assert.doesNotMatch(source, /录制 Replay 测试输入（Tab）/);
  assert.doesNotMatch(source, /方向键 \/ WASD 移动/);
});
