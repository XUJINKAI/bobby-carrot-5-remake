import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "../../model/dist/index.js";
import {
  adventureLevelId,
  augmentAdventureLevel,
  campaignSequenceForChapter,
  collectAdventureLevelReward,
  completedAdventureLevelCount,
  completeAdventureLevel,
  createAdventureLevelRewards,
  createAdventureSave,
  grantAdventureItem,
  isAdventureChapterCompleted,
  isAdventureLevelCompleted,
  isAdventureLevelUnlocked,
  parseAdventureSave,
  planAdventureSession,
  purchaseAdventureItem,
  resolveBonusKeyVendorInteraction,
  serializeAdventureSave,
  setAdventureResumeLevel,
  settleAdventureLevelCompletion,
  specialSceneIdForSource,
} from "../dist/index.js";

test("original campaign uses continuous 1-40 ids and inserts bonus records after 3 and 6", () => {
  assert.equal(adventureLevelId(1, 1), "1-1");
  assert.equal(adventureLevelId(40, 10), "40-10");
  assert.deepEqual(campaignSequenceForChapter(1), [
    "1-1",
    "1-2",
    "1-3",
    "1-bonus-1",
    "1-4",
    "1-5",
    "1-6",
    "1-bonus-2",
    "1-7",
    "1-8",
    "1-9",
    "1-10",
  ]);
  assert.equal(specialSceneIdForSource(1), "beaver-shop");
  assert.equal(specialSceneIdForSource(5), "campaign-intro");
});

test("every chapter is selectable while progression remains linear inside each chapter", () => {
  let save = createAdventureSave();
  for (const chapter of [1, 2, 20, 40]) {
    assert.equal(isAdventureLevelUnlocked(save, `${chapter}-1`), true);
    assert.equal(isAdventureLevelUnlocked(save, `${chapter}-2`), false);
  }
  save = completeAdventureLevel(save, "20-1");
  assert.deepEqual(save.campaign.completedThrough, { "20": "20-1" });
  assert.equal(isAdventureLevelCompleted(save, "20-1"), true);
  assert.equal(isAdventureLevelUnlocked(save, "20-2"), true);
  assert.equal(isAdventureLevelUnlocked(save, "20-3"), false);
  assert.throws(
    () => completeAdventureLevel(save, "20-3"),
    /尚未解锁/,
  );
});

test("Adventure Save 只接受每章一个完成位置", () => {
  assert.throws(
    () =>
      parseAdventureSave(JSON.stringify({
        ...createAdventureSave(),
        campaign: {
          completedLevels: ["1-1"],
          completedEvents: [],
          resumeLevelId: "1-2",
        },
      })),
    /completedThrough/,
  );
});

test("Adventure Save 只保存已结算经济和永久进度", () => {
  const save = createAdventureSave();
  assert.deepEqual(Object.keys(save), [
    "schemaVersion",
    "game",
    "campaign",
    "economy",
    "items",
  ]);
  assert.deepEqual(JSON.parse(serializeAdventureSave(save)), save);
});

test("resume follows the last unfinished level and replaying completed levels does not move it", () => {
  let save = createAdventureSave();
  assert.equal(save.campaign.resumeLevelId, "1-1");
  save = setAdventureResumeLevel(save, "25-1");
  assert.equal(save.campaign.resumeLevelId, "25-1");
  save = completeAdventureLevel(save, "25-1");
  assert.equal(save.campaign.resumeLevelId, "25-2");
  save = setAdventureResumeLevel(save, "25-1");
  assert.equal(save.campaign.resumeLevelId, "25-2");
});

test("bonus levels remain mandatory for chapter completion", () => {
  let save = createAdventureSave();
  const sequence = campaignSequenceForChapter(1);
  for (const id of sequence.slice(0, -1))
    save = completeAdventureLevel(save, id);
  assert.equal(isAdventureChapterCompleted(save, 1), false);
  assert.deepEqual(save.campaign.completedThrough, { "1": "1-9" });
  save = completeAdventureLevel(save, "1-10");
  assert.equal(isAdventureChapterCompleted(save, 1), true);
  assert.equal(completedAdventureLevelCount(save), 12);
});

test("map-native currency remains present on every new Adventure level instance", () => {
  const level = {
    schemaVersion: 1,
    width: 3,
    height: 2,
    entities: [
      { type: MapEntityTypeId.START, x: 0, y: 0 },
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 0, y: 1 },
      { type: MapEntityTypeId.BONUS_COIN, x: 1, y: 0 },
      { type: MapEntityTypeId.GOLDEN_CARROT, x: 0, y: 1 },
    ],
  };
  const first = augmentAdventureLevel(level);
  const second = augmentAdventureLevel(level);
  for (const instance of [first, second]) {
    assert.equal(instance.entities.some((e) => e.type === MapEntityTypeId.BONUS_COIN), true);
    assert.equal(instance.entities.some((e) => e.type === MapEntityTypeId.GOLDEN_CARROT), true);
  }
});

test("Adventure session projects concrete locomotion and reusable lock access", () => {
  let save = createAdventureSave();
  save.economy.bonusCoins = 7;
  save.economy.goldenCarrots = 2;
  save = grantAdventureItem(save, "golden-key");
  save = grantAdventureItem(save, "speed-shoes");
  const plan = planAdventureSession("1-bonus-1", save);
  assert.equal(plan.reusableLockKey, true);
  assert.equal(plan.bobbyMoveMs, 266);
  assert.equal(Object.hasOwn(plan, "capabilities"), false);
  assert.equal(Object.hasOwn(plan, "economy"), false);
  assert.equal(Object.hasOwn(plan, "viewportPolicy"), false);
});

test("Bonus runtime parameters are injected by Adventure policy, not Original maps", () => {
  const save = createAdventureSave();
  const level = {
    schemaVersion: 1,
    width: 4,
    height: 4,
    entities: [
      { type: MapEntityTypeId.BEAVER, x: 0, y: 0, direction: "right" },
      { type: MapEntityTypeId.LOCK, x: 2, y: 2 },
    ],
  };
  const regularPlan = planAdventureSession("1-1", save);
  assert.deepEqual(regularPlan.levelPatches, []);

  const bonusPlan = planAdventureSession("1-bonus-1", save, {
    locomotion: {
      normalMoveMs: 400,
      speedShoesMoveMs: 300,
    },
    bonus: {
      lock: { deathCountdownSeconds: 45 },
    },
  });
  const prepared = augmentAdventureLevel(
    level,
    bonusPlan.levelPatches,
  );
  assert.equal(prepared.entities[0].dialogue, undefined);
  assert.equal(prepared.entities[1].deathCountdownSeconds, 45);
});

test("Adventure 只在关卡完成时结算本局奖励", () => {
  const save = createAdventureSave();
  let rewards = createAdventureLevelRewards();
  rewards = collectAdventureLevelReward(rewards, MapEntityTypeId.BONUS_COIN);
  rewards = collectAdventureLevelReward(rewards, MapEntityTypeId.GOLDEN_CARROT);

  assert.deepEqual(save.economy, { bonusCoins: 0, goldenCarrots: 0 });
  const completed = settleAdventureLevelCompletion(save, "1-1", rewards);
  assert.deepEqual(completed.economy, { bonusCoins: 1, goldenCarrots: 1 });
  assert.equal(isAdventureLevelCompleted(completed, "1-1"), true);

  const replayRewards = collectAdventureLevelReward(
    createAdventureLevelRewards(),
    MapEntityTypeId.BONUS_COIN,
  );
  const replayed = settleAdventureLevelCompletion(
    completed,
    "1-1",
    replayRewards,
  );
  assert.deepEqual(replayed.economy, { bonusCoins: 2, goldenCarrots: 1 });
});

test("Bonus Beaver 的试用与购买由 Adventure Save 归约", () => {
  let save = createAdventureSave();
  const trial = resolveBonusKeyVendorInteraction(save, {
    hasSingleUseKey: false,
  });
  assert.equal(trial.outcome, "trial-granted");
  assert.equal(trial.grantSingleUseKey, true);
  save = trial.save;
  save.economy.bonusCoins = 3;
  const purchase = resolveBonusKeyVendorInteraction(save, {
    hasSingleUseKey: false,
  });
  assert.equal(purchase.outcome, "purchased");
  assert.equal(purchase.save.economy.bonusCoins, 0);
});

test("永久商品的扣款与授予由 Adventure 原子归约", () => {
  const save = createAdventureSave();
  save.economy.goldenCarrots = 5;

  const purchased = purchaseAdventureItem(
    save,
    "speed-shoes",
    "golden-carrots",
    3,
  );
  assert.equal(purchased.outcome, "purchased");
  assert.equal(purchased.save.economy.goldenCarrots, 2);
  assert.deepEqual(purchased.save.items, ["speed-shoes"]);
  assert.equal(save.economy.goldenCarrots, 5);

  const repeated = purchaseAdventureItem(
    purchased.save,
    "speed-shoes",
    "golden-carrots",
    3,
  );
  assert.equal(repeated.outcome, "already-owned");
  assert.equal(repeated.save.economy.goldenCarrots, 2);

  const insufficient = purchaseAdventureItem(
    purchased.save,
    "coin-radar",
    "golden-carrots",
    3,
  );
  assert.equal(insufficient.outcome, "insufficient-funds");
  assert.equal(insufficient.save.economy.goldenCarrots, 2);
  assert.throws(
    () => purchaseAdventureItem(save, "stereo", "bonus-coins", -1),
    /价格必须是非负有限数/,
  );
});
