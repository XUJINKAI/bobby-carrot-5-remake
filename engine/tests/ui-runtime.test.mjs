import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { buildGameplayHudModel } from "../dist/ui/GameplayHudModel.js";
import {
  formatGameplayCountdown,
  formatGameplayElapsed,
} from "../dist/ui/GameplayHudView.js";

function emptyInventory() {
  return {
    gas: false,
    shovel: false,
    kite: false,
    beans: 0,
    singleUseLockKey: false,
    reusableLockKey: false,
  };
}

function state(overrides = {}) {
  const inventory = overrides.inventory ?? emptyInventory();
  return {
    status: "playing",
    deathReason: null,
    moves: 0,
    primaryActorId: 1,
    actors: [{
      id: 1,
      position: { x: 0, y: 0 },
      facing: "down",
      inventory,
      moveDurationMs: 350,
    }],
    player: { x: 0, y: 0 },
    facing: "down",
    inventory,
    ridingMower: false,
    forced: null,
    elapsedMs: 0,
    bonusCoinsInLevel: 0,
    goldenCarrotsInLevel: 0,
    timedChallengePhase: null,
    timedChallengeRemainingMs: null,
    canUndo: false,
    canRedo: false,
    ...overrides,
  };
}

test("egg-only objective projects to egg counter without carrot", () => {
  const model = buildGameplayHudModel(state(), {
    type: "fill-all",
    target: "egg-nest",
    filler: "filled-egg",
    completed: false,
    remaining: 4,
  });
  assert.equal(model.objectives.carrotRemaining, null);
  assert.equal(model.objectives.eggRemaining, 4);
});

test("Gameplay HUD 投影 Timed Challenge 剩余时间", () => {
  const model = buildGameplayHudModel(
    state({
      timedChallengePhase: "running",
      timedChallengeRemainingMs: 59_250,
    }),
    null,
  );
  assert.equal(model.timedChallengeRemainingMs, 59_250);
  assert.equal(model.timedChallengePhase, "running");
  assert.equal(formatGameplayCountdown(60_000), "01:00");
  assert.equal(formatGameplayCountdown(59_001), "01:00");
  assert.equal(formatGameplayCountdown(59_000), "00:59");
});

test("Gameplay HUD 正向显示本关已用时间", () => {
  const model = buildGameplayHudModel(state({ elapsedMs: 59_999 }), null);
  assert.equal(model.elapsedMs, 59_999);
  assert.equal(formatGameplayElapsed(999), "00:00");
  assert.equal(formatGameplayElapsed(1_000), "00:01");
  assert.equal(formatGameplayElapsed(59_999), "00:59");
  assert.equal(formatGameplayElapsed(60_000), "01:00");
});

test("Gameplay HUD projects the four map-local inventory items", () => {
  const model = buildGameplayHudModel(
    state({
      inventory: {
        gas: true,
        shovel: true,
        kite: true,
        beans: 3,
        singleUseLockKey: true,
        reusableLockKey: false,
      },
    }),
    null,
  );
  assert.deepEqual(model.inventories, [{
    actorId: 1,
    role: "primary",
    gas: true,
    shovel: true,
    kite: true,
    beans: 3,
  }]);
});

test("Gameplay HUD projects primary and secondary inventories separately", () => {
  const model = buildGameplayHudModel(state({
    actors: [
      {
        id: 1,
        position: { x: 0, y: 0 },
        facing: "down",
        inventory: { ...emptyInventory(), beans: 2 },
        moveDurationMs: 350,
      },
      {
        id: 2,
        position: { x: 1, y: 0 },
        facing: "down",
        inventory: { ...emptyInventory(), shovel: true },
        moveDurationMs: 350,
      },
    ],
  }), null);
  assert.deepEqual(model.inventories.map((inventory) => ({
    actorId: inventory.actorId,
    role: inventory.role,
    beans: inventory.beans,
    shovel: inventory.shovel,
  })), [
    { actorId: 1, role: "primary", beans: 2, shovel: false },
    { actorId: 2, role: "secondary", beans: 0, shovel: true },
  ]);
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

test("Gameplay HUD uses objective plus primary and secondary inventory rows", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayHudView.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /opacity: "0\.68"/);
  assert.match(source, /valueFontSize: "26px"/);
  assert.match(source, /root\.append\(value, icon\)/);
  assert.match(source, /inventoryRow\("primary", "#ff665e"\)/);
  assert.match(source, /inventoryRow\("secondary", "#5796ff"\)/);
  assert.match(source, /root\.append\(marker, kite\.root, bean\.root, shovel\.root, gas\.root\)/);
  assert.doesNotMatch(source, /border:|borderRadius:|background:|boxShadow:/);
  assert.doesNotMatch(source, /goldenCarrotChip|bonusCoinChip/);
});

test("Gameplay HUD exposes host styling hooks without naming a product font", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayHudView.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /className = "engine-gameplay-hud-value"/);
  assert.match(source, /--engine-gameplay-hud-value-font-size/);
  assert.match(source, /\$\{options\.valueFontSize\}/);
  assert.doesNotMatch(source, /Jersey 10|fontFamily|WebkitTextStroke|textShadow/);
});

test("Gameplay Dialog renders zero-to-many data-driven options without button focus", () => {
  const source = fs.readFileSync(
    new URL("../src/ui/GameplayDialog.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /presentation\.options \?\? \[\]/);
  assert.match(source, /options\.map\(\(option\) => this\.optionButton\(option\)\)/);
  assert.match(source, /repeat\(auto-fit, minmax\(96px, 1fr\)\)/);
  assert.match(source, /button\.tabIndex = -1/);
  assert.match(source, /dataset\.dialogOption = option\.id/);
  assert.doesNotMatch(source, /leftLabel|rightLabel/);
});
