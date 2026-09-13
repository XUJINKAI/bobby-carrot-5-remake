import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("各游戏入口通过 Engine HUD 配置展示对应信息", async () => {
  const [stageSource, pageSource, configSource] = await Promise.all([
    readFile(
      new URL("../src/pages/game/GameStage.vue", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/pages/game/gameplayHudConfig.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(stageSource, /product-game-statistics|data-product-time/);
  assert.match(pageSource, /hud: resolveGameplayHudConfig\(/);
  assert.match(configSource, /if \(mode === "explore"\) return true/);
  assert.match(configSource, /if \(sceneId === undefined\) return \{ steps: false \}/);
  assert.match(configSource, /if \(sceneId === "beaver-shop"\)/);
  assert.match(configSource, /timer: false/);
  assert.match(configSource, /steps: false/);
  assert.match(configSource, /objective: false/);
  assert.match(configSource, /items: false/);
  assert.match(configSource, /coins: adventureCoins/);
  assert.match(configSource, /return false/);
});

test("地图编辑入口使用独立的简洁铅笔图标语义", async () => {
  const source = await readFile(
    new URL("../src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /icon: "edit-map"/);
});
