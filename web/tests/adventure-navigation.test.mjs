import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";

test("Adventure 首页在 Beaver Shop 入口显示 Bonus Coin 余额", async () => {
  const source = await readFile(
    new URL("../src/pages/adventure/AdventureHomePage.vue", import.meta.url),
    "utf8",
  );

  assert.match(source, /购买全局物品，当前金币数：\{\{ view\.bonusCoins \}\}/);
  assert.doesNotMatch(source, /adventure-wallet/);
  assert.doesNotMatch(source, /view\.goldenCarrots/);
});

test("Night Train 提供 Dreamland Reward 目的地和路由", async () => {
  const [mountSource, routerSource] = await Promise.all([
    readFile(
      new URL("../src/pages/adventure/mountAdventurePages.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/app/BobbyApp.ts", import.meta.url), "utf8"),
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
