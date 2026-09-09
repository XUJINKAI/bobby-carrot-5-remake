import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

const components = [
  "AdventureHomePage.vue",
  "AdventureChaptersPage.vue",
  "AdventureChapterPage.vue",
  "AdventureNightTrainPage.vue",
];

test("Adventure 入口复用首页按钮主题色", async () => {
  const sources = await Promise.all(
    components.map((name) =>
      readFile(new URL(`../src/pages/adventure/${name}`, import.meta.url), "utf8"),
    ),
  );

  for (const source of sources) {
    assert.match(
      source,
      /background: color-mix\(in srgb, var\(--bc-panel\) 92%, transparent\)/,
    );
    assert.match(source, /border[^;]*var\(--bc-panel-border\)/);
    assert.match(source, /border-radius: var\(--bc-control-radius\)/);
    assert.match(source, /box-shadow: var\(--bc-panel-shadow\)/);
    assert.match(source, /background: var\(--bc-control-hover\)/);
  }
});

test("Adventure 首页主要入口复用首页激活色", async () => {
  const source = await readFile(
    new URL("../src/pages/adventure/AdventureHomePage.vue", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /\.adventure-menu-card\.primary\s*\{[\s\S]*?border-color: var\(--bc-highlight\);[\s\S]*?background: var\(--bc-active\);/,
  );
  assert.match(
    source,
    /<span class="eyebrow adventure-menu-eyebrow">冒险模式<\/span>\s*<a\s+class="adventure-menu-card primary"/,
  );
});
