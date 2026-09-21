import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import { resolveGameplayOutcomeMusic } from "../../../web/src/pages/game/gameplayMusicConfig.ts";

test("商店和 Night Train 三张场景关闭获胜音乐", () => {
  for (const sceneId of [
    "beaver-shop",
    "cloud-9",
    "dream-machine",
    "dreamland-reward",
  ]) {
    assert.deepEqual(resolveGameplayOutcomeMusic(sceneId), { won: false });
  }
  assert.equal(resolveGameplayOutcomeMusic("campaign-intro"), undefined);
  assert.equal(resolveGameplayOutcomeMusic(undefined), undefined);
});

test("首页 Demo 关闭获胜音乐", async () => {
  const [homeSource, gameSource] = await Promise.all([
    readFile(
      new URL("../../../web/src/pages/home/mountHomePage.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../../../web/src/pages/game/mountGamePage.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(homeSource, /outcomeMusic: \{ won: false \}/);
  assert.match(gameSource, /resolveGameplayOutcomeMusic\(adventureScene\?\.id\)/);
  assert.match(gameSource, /outcomeMusic \? \{ outcomeMusic \} : \{\}/);
});
