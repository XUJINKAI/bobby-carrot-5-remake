import test from "node:test";
import assert from "node:assert/strict";
import { ObjectId, Terrain } from "../../model/dist/index.js";
import {
  adventureLevelId,
  campaignSequenceForChapter,
  claimPersistentReward,
  completeAdventureLevel,
  createAdventureSave,
  isAdventureLevelUnlocked,
  planAdventureSession,
  prepareAdventureLevel,
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

test("Adventure unlocks each four-chapter group like the original while keeping level progress linear", () => {
  let save = createAdventureSave();
  assert.deepEqual(
    save.campaign.unlockedChapters,
    [1, 5, 9, 13, 17, 21, 25, 29, 33, 37],
  );
  assert.equal(isAdventureLevelUnlocked(save, "1-1"), true);
  assert.equal(isAdventureLevelUnlocked(save, "1-2"), false);
  assert.equal(isAdventureLevelUnlocked(save, "5-1"), true);
  assert.equal(isAdventureLevelUnlocked(save, "6-1"), false);

  save = completeAdventureLevel(save, "1-1");
  assert.equal(isAdventureLevelUnlocked(save, "1-2"), true);
  for (const id of campaignSequenceForChapter(1).slice(1))
    save = completeAdventureLevel(save, id);
  assert.deepEqual(
    save.campaign.unlockedChapters,
    [1, 2, 3, 4, 5, 9, 13, 17, 21, 25, 29, 33, 37],
  );

  for (const id of campaignSequenceForChapter(13))
    save = completeAdventureLevel(save, id);
  assert.deepEqual(
    save.campaign.unlockedChapters,
    [1, 2, 3, 4, 5, 9, 13, 14, 15, 16, 17, 21, 25, 29, 33, 37],
  );
});

test("persistent global rewards are identified by level and map position", () => {
  const level = {
    width: 3,
    height: 2,
    terrain: [
      [Terrain.START, Terrain.GROUND_C, Terrain.EXIT],
      [Terrain.GROUND_C, Terrain.GROUND_C, Terrain.GROUND_C],
    ],
    objects: [
      { type: ObjectId.BONUS_COIN, x: 1, y: 0 },
      { type: ObjectId.GOLDEN_CARROT, x: 1, y: 1 },
    ],
  };
  let save = createAdventureSave();
  save = claimPersistentReward(save, "1-1", ObjectId.BONUS_COIN, 1, 0);
  assert.equal(save.economy.bonusCoins, 1);
  assert.deepEqual(prepareAdventureLevel("1-1", level, save).objects, [
    { type: ObjectId.GOLDEN_CARROT, x: 1, y: 1 },
  ]);
  const again = claimPersistentReward(save, "1-1", ObjectId.BONUS_COIN, 1, 0);
  assert.equal(again.economy.bonusCoins, 1);
});

test("Bonus maps encode the original 60 second challenge into Lock properties", () => {
  const level = {
    width: 3,
    height: 1,
    terrain: [[Terrain.START, Terrain.GROUND_C, Terrain.EXIT]],
    objects: [
      { type: ObjectId.LOCK, x: 1, y: 0 },
      { type: ObjectId.GOLDEN_CARROT, x: 2, y: 0 },
    ],
  };
  const save = createAdventureSave();
  const bonus = prepareAdventureLevel("1-bonus-1", level, save);
  const regular = prepareAdventureLevel("1-1", level, save);

  assert.equal(
    bonus.objects.find((object) => object.type === ObjectId.LOCK)?.properties
      ?.timedChallengeMs,
    "60000",
  );
  assert.equal(
    regular.objects.find((object) => object.type === ObjectId.LOCK)?.properties,
    undefined,
  );
  assert.equal(planAdventureSession("1-bonus-1", save).viewportPolicy, "original-portrait");
  assert.equal(
    Object.hasOwn(planAdventureSession("1-bonus-1", save), "timedChallengeMs"),
    false,
  );
});
