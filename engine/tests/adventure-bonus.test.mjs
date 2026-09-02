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
    height: 2,
    ...(rules ? { rules } : {}),
    entities: [
      ground(0, 0),
      ground(1, 0),
      ground(2, 0),
      ground(3, 0),
      bobby(0, 0),
      ...extra,
    ],
  };
}

function move(world, direction) {
  const actor = world.query.entitiesWithTrait("player")[0];
  assert.ok(actor, "test map must contain a player actor");
  return world.step({
    intents: [
      {
        type: "move",
        actorId: actor.id,
        direction,
        cause: { type: "player-input", source: "test" },
      },
    ],
  });
}

test("reach can complete on a collectible removed by onEnter", () => {
  const world = new World(
    corridor(
      [{ type: EntityTypeId.GOLDEN_CARROT, x: 1, y: 0 }],
      { win: { type: "reach", target: EntityTypeId.GOLDEN_CARROT } },
    ),
  );
  const result = move(world, "right");
  assert.equal(result.moves[0].moved, true);
  assert.equal(world.state.economy.goldenCarrots, 1);
  assert.equal(world.completed, true);
  assert.equal(
    world.entities
      .all()
      .some((entity) => entity.type === EntityTypeId.GOLDEN_CARROT),
    false,
  );
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
  const firstTouch = move(first, "right");
  assert.equal(firstTouch.moves[0].moved, false);
  assert.equal(first.state.inventory.temporaryKey, true);
  assert.equal(first.state.economy.bonusCoins, 3);
  assert.equal(first.state.profile.bonusKeyTrialUsed, true);
  assert.equal(
    firstTouch.events.some((event) => event.type === "bonus-key-trial-granted"),
    true,
  );

  const later = new World(map, {
    profile: { bonusKeyTrialUsed: true },
    economy: { bonusCoins: 3 },
  });
  const laterTouch = move(later, "right");
  assert.equal(laterTouch.moves[0].moved, false);
  assert.equal(later.state.inventory.temporaryKey, true);
  assert.equal(later.state.economy.bonusCoins, 0);
  assert.equal(
    laterTouch.events.some((event) => event.type === "spend-bonus-coins"),
    true,
  );
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
  const unlock = move(world, "right");
  assert.equal(unlock.moves[0].moved, true);
  assert.equal(world.state.inventory.temporaryKey, false);
  assert.equal(
    unlock.events.some((event) => event.type === "death-countdown-started"),
    true,
  );
  world.update({ stepMs: 1000, tick: 1 });
  assert.equal(world.dead, true);
});

test("permanent key opens the lock without being consumed", () => {
  const world = new World(
    corridor([{ type: EntityTypeId.LOCK, x: 1, y: 0 }]),
    { profile: { superKey: true } },
  );
  assert.equal(move(world, "right").moves[0].moved, true);
  assert.equal(world.state.profile.superKey, true);
});
