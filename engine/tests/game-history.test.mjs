import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../dist/core/Game.js";
import { GameDebugControls } from "../dist/core/GameDebugControls.js";
import { GameplaySession } from "../dist/core/GameplaySession.js";

test("GameplaySession 在暂停时不按真实时间推进", () => {
  const session = new GameplaySession();
  session.loadLevel({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "bobby", x: 0, y: 0 },
    ],
  });
  session.clock.pause();
  assert.deepEqual(session.advanceRealTime(1000, () => ({})), []);
  assert.equal(session.clock.tickCount, 0);
});

test("WorldClock pause blocks direct Game.move gameplay bypass", () => {
  const game = Object.create(Game.prototype);
  game.session = {
    hasLevel: true,
    clock: { paused: true },
    world: { dead: false, completed: false },
  };
  game.replayPlayback = { playing: false };
  game.queuedMoves = [];

  assert.equal(game.move("right"), undefined);
  assert.deepEqual(game.queuedMoves, []);
});

test("实时推进可在选项对话出现后停止同批后续 Tick", () => {
  const session = new GameplaySession({ timing: { worldHz: 20 } });
  session.loadLevel({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "bobby", x: 0, y: 0 },
    ],
  });
  const consumed = session.advanceRealTime(
    1_000,
    () => ({}),
    Number.POSITIVE_INFINITY,
    () => false,
  );

  assert.equal(consumed.length, 1);
  assert.equal(session.clock.tickCount, 1);
});

test("blocked player move forwards its attempted direction to presentation", () => {
  const game = Object.create(Game.prototype);
  const calls = [];
  const frame = { frame: 2, nowMs: 120, deltaMs: 16 };
  game.presentation = {
    clock: { current: frame },
    visual: { faceDirection: (...args) => calls.push(args) },
  };
  game.session = {
    world: {
      query: { entityHasTrait: (id, trait) => id === 3 && trait === "player" },
    },
  };
  game.faceBlockedActors([
    {
      actorId: 3,
      moved: false,
      blocked: true,
      from: { x: 0, y: 0 },
      to: { x: 0, y: -1 },
      direction: "up",
      passage: { reason: "blocked", confidence: "rule" },
      events: [],
    },
  ]);

  assert.deepEqual(calls, [[3, "up", frame]]);
});

test("Debug pause freezes only WorldClock and preserves input plus held state", () => {
  const controls = Object.create(GameDebugControls.prototype);
  let paused = false;
  let inputEnabled = true;
  const inputTransitions = [];
  controls.session = {
    clock: {
      get paused() {
        return paused;
      },
      pause() {
        paused = true;
      },
      resume() {
        paused = false;
      },
    },
  };
  controls.inputController = {
    get isEnabled() {
      return inputEnabled;
    },
    setEnabled(value) {
      inputEnabled = value;
      inputTransitions.push(value);
    },
  };
  const heldState = { direction: "right", blocked: true };
  controls.host = { render() {} };

  controls.pauseWorld();
  assert.equal(paused, true);
  assert.equal(inputEnabled, true);
  assert.deepEqual(heldState, { direction: "right", blocked: true });
  assert.deepEqual(inputTransitions, []);

  controls.resumeWorld();
  assert.equal(paused, false);
  assert.equal(inputEnabled, true);
  assert.deepEqual(heldState, { direction: "right", blocked: true });
  assert.deepEqual(inputTransitions, []);
});
test("Debug pause leaves host-disabled input disabled", () => {
  const controls = Object.create(GameDebugControls.prototype);
  let paused = false;
  let inputEnabled = false;
  controls.session = {
    clock: {
      get paused() {
        return paused;
      },
      pause() {
        paused = true;
      },
      resume() {
        paused = false;
      },
    },
  };
  controls.inputController = {
    get isEnabled() {
      return inputEnabled;
    },
    setEnabled(value) {
      inputEnabled = value;
    },
  };
  controls.host = { render() {} };

  controls.pauseWorld();
  controls.resumeWorld();
  assert.equal(inputEnabled, false);
});

test("Debug teleport hard-moves only the selected actor and clears its transient runtime", () => {
  const controls = Object.create(GameDebugControls.prototype);
  const actor = {
    id: 2,
    type: "bobby",
    anchor: { x: 0, y: 0 },
    direction: "right",
  };
  let moved = null;
  let cancelled = null;
  let cleared = null;
  let pendingDiscarded = false;
  controls.enabledValue = true;
  const world = {
    entities: {
      get: (id) => (id === actor.id ? actor : undefined),
    },
    definition: () => ({ footprint: undefined }),
    spatial: {
      inBounds: ({ x, y }) => x >= 0 && y >= 0 && x < 4 && y < 3,
      presencesAt: () => [],
      moveEntity: (id, cell) => {
        moved = { id, cell: { ...cell } };
        actor.anchor = { ...cell };
      },
    },
    actions: {
      cancelOwnedBy: (id) => {
        cancelled = id;
      },
    },
    movement: {
      clearEntity() {},
    },
  };
  controls.session = {
    hasLevel: true,
    world,
    actorIds: [actor.id],
    discardPendingHistory() {
      pendingDiscarded = true;
    },
  };
  controls.presentation = {
    visual: {
      clearEntity: (id) => {
        cleared = id;
      },
    },
  };
  controls.externalActorIdValue = null;
  let clearedLastResults = false;
  controls.host = {
    world: () => world,
    clearLastResults: () => {
      clearedLastResults = true;
    },
  };

  assert.equal(controls.teleportActor(actor.id, { x: 3, y: 2 }), true);
  assert.deepEqual(moved, { id: actor.id, cell: { x: 3, y: 2 } });
  assert.deepEqual(actor.anchor, { x: 3, y: 2 });
  assert.equal(cancelled, actor.id);
  assert.equal(cleared, actor.id);
  assert.equal(pendingDiscarded, true);
  assert.equal(clearedLastResults, true);

  assert.equal(controls.teleportActor(actor.id, { x: 4, y: 2 }), false);
  assert.deepEqual(actor.anchor, { x: 3, y: 2 });

  world.spatial.presencesAt = () => [{ entityId: 3, traits: ["player"] }];
  assert.equal(controls.teleportActor(actor.id, { x: 1, y: 1 }), false);
  assert.deepEqual(actor.anchor, { x: 3, y: 2 });
});
