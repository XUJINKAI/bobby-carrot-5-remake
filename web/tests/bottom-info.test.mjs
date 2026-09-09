import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("首页 Demo 状态区提供基础移动引导", async () => {
  const source = await readFile(
    new URL("../src/pages/home/mountHomePage.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /demoStatus: "WASD \/ 方向键移动"/);
  assert.doesNotMatch(source, /\{ text: "WASD \/ 方向键移动" \}/);
});

test("游戏与 Embed 的 BottomBar 保留操作区并留空 Info", async () => {
  const [gameSource, embedSource] = await Promise.all([
    readFile(
      new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/pages/embed/mountEmbedPage.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(gameSource, /\binfo:\s*\[/);
  assert.match(embedSource, /bottomBar: \{ visible: true \}/);
  assert.doesNotMatch(embedSource, /\binfo:\s*\[/);
});

test("Adventure 导航页面隐藏 BottomBar", async () => {
  const source = await readFile(
    new URL(
      "../src/pages/adventure/mountAdventurePages.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    source,
    /bottomBar:\s*\{\s*visible: false,\s*fixed: true,\s*\}/,
  );
});
