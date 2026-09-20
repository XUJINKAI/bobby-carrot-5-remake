import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("Adventure 首页在 Beaver Shop 入口显示 Bonus Coin 余额", async () => {
  const source = await readFile(
    new URL("../../../web/src/pages/adventure/AdventureHomePage.vue", import.meta.url),
    "utf8",
  );

  assert.match(source, /webT\("adventure\.shopDescription", \{ coins: view\.bonusCoins \}\)/);
  assert.doesNotMatch(source, /adventure-wallet/);
  assert.doesNotMatch(source, /view\.goldenCarrots/);
});

test("Night Train 提供 Dreamland Reward 目的地和路由", async () => {
  const [mountSource, routerSource] = await Promise.all([
    readFile(
      new URL("../../../web/src/pages/adventure/mountAdventurePages.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../../../web/src/app/BobbyApp.ts", import.meta.url), "utf8"),
  ]);

  assert.match(mountSource, /label: "DREAMLAND REWARD"/);
  assert.match(
    mountSource,
    /href: "\/adventure\/night-train\/dreamland-reward"/,
  );
  assert.match(
    routerSource,
    /renderAdventureScene\(\s*"dreamland-reward",\s*context,\s*"\/adventure\/night-train"/,
  );
});

test("Night Train 与 Adventure Special Scene 使用原版音乐职责", async () => {
  const [adventureSource, gameSource] = await Promise.all([
    readFile(
      new URL("../../../web/src/pages/adventure/mountAdventurePages.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../../web/src/pages/game/mountGamePage.ts", import.meta.url),
      "utf8",
    ),
  ]);
  const nightTrain = adventureSource.match(
    /export function renderAdventureNightTrain[\s\S]*?\n}\n\nexport function findAdventureLevel/,
  )?.[0] ?? "";

  assert.match(nightTrain, /audio\.playMusic\("train"\)/);
  assert.doesNotMatch(nightTrain, /audio\.playMusic\("title"\)/);
  assert.doesNotMatch(
    gameSource,
    /adventureScene\s*\?\s*\{\s*levelMusicOverride/,
  );
});
