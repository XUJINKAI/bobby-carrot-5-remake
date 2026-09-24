import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import adventureEn from "../../../i18n/src/locales/adventure/en.ts";
import adventureZhCN from "../../../i18n/src/locales/adventure/zh-CN.ts";

const components = [
  "AdventureHomePage.vue",
  "AdventureChaptersPage.vue",
  "AdventureChapterPage.vue",
  "AdventureNightTrainPage.vue",
];

test("Adventure 入口复用首页按钮主题色", async () => {
  const sources = await Promise.all(
    components.map((name) =>
      readFile(
        new URL(`../../../web/src/pages/adventure/${name}`, import.meta.url),
        "utf8",
      ),
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

test("Adventure 首页入口使用同级样式并标明继续关卡", async () => {
  const source = await readFile(
    new URL("../../../web/src/pages/adventure/AdventureHomePage.vue", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /adventure-menu-card primary/);
  assert.doesNotMatch(source, /\.adventure-menu-card\.primary/);
  assert.match(source, /webT\("adventure\.continueLevel"/);
  assert.match(source, /id:\s*view\.resumeLevelId\.toUpperCase\(\)/);
  assert.equal(adventureZhCN["adventure.continueLevel"], "继续关卡: {id}");
  assert.equal(adventureEn["adventure.continueLevel"], "Continue Level: {id}");
  assert.doesNotMatch(source, /resumeChapterTitle/);
});
