import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: EntityTypeId.GROUND_C, x, y });
const bobby = (x, y) => ({ type: EntityTypeId.BOBBY, x, y, direction: "right" });

function corridor(extra, rules) {
  return {
    schemaVersion: 1,
    width: 4,
    height: 1,
    ...(rules ? { rules } : {}),
    entities: [ground(0, 0), ground(1, 0), ground(2, 0), ground(3, 0), bobby(0, 0), ...extra],
  };
}

test("reach can complete on a collectible removed by onEnter", () => {
  const world = new World(
    corridor(
      [{ type: EntityTypeId.GOLDEN_CARROT, x: 1, y: 0 }],
      { win: { type: "reach", target: EntityTypeId.GOLDEN_CARROT } },
    ),
  );
  const result = world.move("right");
  assert.equal(result.moved, true);
  assert.equal(world.state.economy.goldenCarrots, 1);
  assert.equal(world.completed, true);
  assert.equal(world.entities.all().some((e) => e.type === EntityTypeId.GOLDEN_CARROT), false);
});

test("bonus beaver grants one trial key, then sells temporary keys for three coins", () => {
  const map = corridor([
    {
      type: EntityTypeId.BEAVER,
      x: 1,
      y: 0,
      properties: { interaction: "bonus-key-vendor" },
    },
  ]);
  const first = new World(map, { economy: { bonusCoins: 3 } });
  const firstTouch = first.move("right");
  assert.equal(firstTouch.moved, false);
  assert.equal(first.state.inventory.temporaryKey, true);
  assert.equal(first.state.economy.bonusCoins, 3);
  assert.equal(first.state.profile.bonusKeyTrialUsed, true);
  assert.equal(firstTouch.events.some((e) => e.type === "bonus-key-trial-granted"), true);

  const later = new World(map, {
    profile: { bonusKeyTrialUsed: true },
    economy: { bonusCoins: 3 },
  });
  const laterTouch = later.move("right");
  assert.equal(laterTouch.moved, false);
  assert.equal(later.state.inventory.temporaryKey, true);
  assert.equal(later.state.economy.bonusCoins, 0);
  assert.equal(laterTouch.events.some((e) => e.type === "spend-bonus-coins"), true);
});

test("bonus lock consumes a temporary key and starts a death countdown", () => {
  const world = new World(
    corridor([
      {
        type: EntityTypeId.LOCK,
        x: 1,
        y: 0,
        properties: { deathCountdownSeconds: 1 },
      },
    ]),
  );
  world.state.inventory.temporaryKey = true;
  const unlock = world.move("right");
  assert.equal(unlock.moved, true);
  assert.equal(world.state.inventory.temporaryKey, false);
  assert.equal(unlock.events.some((e) => e.type === "death-countdown-started"), true);
  world.update({ nowMs: 1000, stepMs: 1000, tick: 1 });
  assert.equal(world.dead, true);
});

test("permanent key opens the lock without being consumed", () => {
  const world = new World(
    corridor([{ type: EntityTypeId.LOCK, x: 1, y: 0 }]),
    { profile: { superKey: true } },
  );
  assert.equal(world.move("right").moved, true);
  assert.equal(world.state.profile.superKey, true);
});
