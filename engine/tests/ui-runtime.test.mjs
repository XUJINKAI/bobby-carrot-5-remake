import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { buildGameplayHudModel } from "../dist/ui/GameplayHudModel.js";

function state(overrides = {}) {
  return {
    status: "playing",
    moves: 0,
    player: { x: 0, y: 0 },
    facing: "down",
    inventory: {
      gas: false,
      shovel: false,
      kite: false,
      beans: 0,
      temporaryKey: false,
    },
    economy: { goldenCarrots: 0, bonusCoins: 0 },
    profile: {
      superKey: false,
      speedShoes: false,
      coinRadar: false,
      bonusKeyTrialUsed: false,
    },
    ridingMower: false,
    forced: null,
    bonusCoinsInLevel: 0,
    goldenCarrotsInLevel: 0,
    canUndo: false,
    canRedo: false,
    ...overrides,
  };
}

test("egg-only objective projects to egg counter without carrot", () => {
  const model = buildGameplayHudModel(state(), {
    type: "fill-all",
    target: "egg-nest",
    filler: "egg",
    completed: false,
    remaining: 4,
  });
  assert.equal(model.objectives.carrotRemaining, null);
  assert.equal(model.objectives.eggRemaining, 4);
});

test("Explore superKey capability does not masquerade as an owned HUD key", () => {
  const capabilityOnly = buildGameplayHudModel(
    state({
      profile: {
        superKey: true,
        speedShoes: false,
        coinRadar: false,
        bonusKeyTrialUsed: false,
      },
    }),
    null,
  );
  assert.equal(capabilityOnly.inventory.key, false);

  const temporaryKey = buildGameplayHudModel(
    state({
      inventory: {
        gas: false,
        shovel: false,
        kite: false,
        beans: 0,
        temporaryKey: true,
      },
    }),
    null,
  );
  assert.equal(temporaryKey.inventory.key, true);
});

test("Gameplay HUD exposes persistent economy independently from gameplay inventory", () => {
  const model = buildGameplayHudModel(
    state({ economy: { goldenCarrots: 4, bonusCoins: 9 } }),
    null,
  );
  assert.deepEqual(model.economy, { goldenCarrots: 4, bonusCoins: 9 });
});

test("Gameplay HUD view keeps nodes mounted and toggles display instead of mixing hidden with inline display", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayHudView.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /replaceChildren\(/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /style\.display = visible \? "inline-flex" : "none"/);
  assert.doesNotMatch(source, /\.hidden = !visible/);
});

test("Gameplay HUD presentation uses semantic ImageManager IDs instead of asset URLs or atlas offsets", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayHudView.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /hud-carrot/);
  assert.match(source, /hud-egg/);
  assert.match(source, /loadSlice/);
  assert.doesNotMatch(source, /hud\.png|ts\.png|backgroundPosition/);
});
