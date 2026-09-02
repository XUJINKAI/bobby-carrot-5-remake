import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "../../model/dist/index.js";
import {
  adventureLevelId,
  campaignSequenceForChapter,
  completeAdventureLevel,
  createAdventureLevelInstance,
  createAdventureSave,
  grantAdventureItem,
  isAdventureChapterCompleted,
  isAdventureLevelUnlocked,
  planAdventureSession,
  setAdventureResumeLevel,
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
  assert.equal(isAdventureLevelUnlocked(save, "20-2"), true);
  assert.equal(isAdventureLevelUnlocked(save, "20-3"), false);
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
  for (const id of sequence.filter((id) => !id.includes("bonus")))
    save = completeAdventureLevel(save, id);
  assert.equal(isAdventureChapterCompleted(save, 1), false);
  save = completeAdventureLevel(save, "1-bonus-1");
  save = completeAdventureLevel(save, "1-bonus-2");
  assert.equal(isAdventureChapterCompleted(save, 1), true);
});

test("map-native currency remains present on every new Adventure level instance", () => {
  const level = {
    schemaVersion: 1,
    width: 3,
    height: 2,
    entities: [
      { type: EntityTypeId.START, x: 0, y: 0 },
      { type: EntityTypeId.BOBBY, x: 0, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 1, y: 0 },
      { type: EntityTypeId.GROUND_C, x: 0, y: 1 },
      { type: EntityTypeId.BONUS_COIN, x: 1, y: 0 },
      { type: EntityTypeId.GOLDEN_CARROT, x: 0, y: 1 },
    ],
  };
  const save = createAdventureSave();
  const first = createAdventureLevelInstance("1-1", level, save);
  const second = createAdventureLevelInstance("1-1", level, save);
  for (const instance of [first, second]) {
    assert.equal(instance.entities.some((e) => e.type === EntityTypeId.BONUS_COIN), true);
    assert.equal(instance.entities.some((e) => e.type === EntityTypeId.GOLDEN_CARROT), true);
  }
});

test("Adventure session projects inventory capabilities and wallet into Engine input", () => {
  let save = createAdventureSave();
  save.economy.bonusCoins = 7;
  save.economy.goldenCarrots = 2;
  save = grantAdventureItem(save, "golden-key");
  save = grantAdventureItem(save, "speed-shoes");
  const plan = planAdventureSession("1-bonus-1", save);
  assert.equal(plan.capabilities.goldenKey, true);
  assert.equal(plan.capabilities.speedShoes, true);
  assert.equal(plan.capabilities.coinRadar, false);
  assert.deepEqual(plan.economy, { bonusCoins: 7, goldenCarrots: 2 });
  assert.equal(Object.hasOwn(plan, "viewportPolicy"), false);
});
