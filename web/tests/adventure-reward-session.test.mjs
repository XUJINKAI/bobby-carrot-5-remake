import assert from "node:assert/strict";
import { createAdventureSave } from "@bobby/adventure";
import { test } from "vitest";
import { AdventureRewardSession } from "../src/pages/game/adventureRewardSession.ts";

test("Adventure 奖励在关卡完成时一次性写入存档", () => {
  const rewards = new AdventureRewardSession();
  const save = createAdventureSave();
  rewards.record({ type: "collect-bonus-coin" });
  rewards.record({ type: "collect-golden-carrot" });

  assert.deepEqual(save.economy, { bonusCoins: 0, goldenCarrots: 0 });
  const completed = rewards.complete(save, "1-1");
  assert.deepEqual(completed.economy, { bonusCoins: 1, goldenCarrots: 1 });
});

test("Adventure 失败后重开会丢弃本局临时奖励", () => {
  const rewards = new AdventureRewardSession();
  rewards.record({ type: "collect-bonus-coin" });
  rewards.discard();

  const completed = rewards.complete(createAdventureSave(), "1-1");
  assert.deepEqual(completed.economy, { bonusCoins: 0, goldenCarrots: 0 });
});
