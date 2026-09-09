import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("游戏统计以半透明的两行 22px 文本显示", async () => {
  const [stageSource, pageSource] = await Promise.all([
    readFile(new URL("../src/pages/game/GameStage.vue", import.meta.url), "utf8"),
    readFile(
      new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(stageSource, /font-size: 22px/);
  assert.match(stageSource, /opacity: 0\.68/);
  assert.match(stageSource, /data-product-time/);
  assert.match(stageSource, /data-product-steps/);
  assert.match(pageSource, /productTime\.textContent/);
  assert.match(pageSource, /productSteps\.textContent/);
});

test("地图编辑入口使用独立的简洁铅笔图标语义", async () => {
  const source = await readFile(
    new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /icon: "edit-map"/);
});
