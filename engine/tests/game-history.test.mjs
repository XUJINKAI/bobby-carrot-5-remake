import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../dist/core/Game.js";
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

test("blocked player move forwards its attempted direction to presentation", () => {
  const game = Object.create(Game.prototype);
  const calls = [];
  game.presentationClock = {
    current: { frame: 2, nowMs: 120, deltaMs: 16 },
  };
  game.session = {
    world: {
      query: { entityHasTrait: (id, trait) => id === 3 && trait === "player" },
    },
  };
  game.visual = {
    faceDirection: (...args) => calls.push(args),
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

  assert.deepEqual(calls, [[3, "up", game.presentationClock.current]]);
});

test("Debug pause freezes only WorldClock and preserves input plus held state", () => {
  const game = Object.create(Game.prototype);
  let paused = false;
  let inputEnabled = true;
  const inputTransitions = [];
  game.session = {
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
  game.inputController = {
    get isEnabled() {
      return inputEnabled;
    },
    setEnabled(value) {
      inputEnabled = value;
      inputTransitions.push(value);
    },
  };
  game.heldDirection = "right";
  game.heldDirectionBlocked = true;
  game.render = () => {};

  game.pauseDebugClock();
  assert.equal(paused, true);
  assert.equal(inputEnabled, true);
  assert.equal(game.heldDirection, "right");
  assert.equal(game.heldDirectionBlocked, true);
  assert.deepEqual(inputTransitions, []);

  game.resumeDebugClock();
  assert.equal(paused, false);
  assert.equal(inputEnabled, true);
  assert.equal(game.heldDirection, "right");
  assert.equal(game.heldDirectionBlocked, true);
  assert.deepEqual(inputTransitions, []);
});
test("Debug pause leaves host-disabled input disabled", () => {
  const game = Object.create(Game.prototype);
  let paused = false;
  let inputEnabled = false;
  game.session = {
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
  game.inputController = {
    get isEnabled() {
      return inputEnabled;
    },
    setEnabled(value) {
      inputEnabled = value;
    },
  };
  game.render = () => {};

  game.pauseDebugClock();
  game.resumeDebugClock();
  assert.equal(inputEnabled, false);
});

test("Debug teleport hard-moves only the selected actor and clears its transient runtime", () => {
  const game = Object.create(Game.prototype);
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
  game.debugValue = true;
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
  game.session = {
    hasLevel: true,
    world,
    actorIds: [actor.id],
    discardPendingHistory() {
      pendingDiscarded = true;
    },
  };
  game.visual = {
    clearEntity: (id) => {
      cleared = id;
    },
  };
  game.debugExternalActorId = null;
  game.inputController = null;
  game.lastMove = { moved: true };
  game.lastWorldEvents = [{ type: "message", message: "old" }];

  assert.equal(game.debugTeleportActor(actor.id, { x: 3, y: 2 }), true);
  assert.deepEqual(moved, { id: actor.id, cell: { x: 3, y: 2 } });
  assert.deepEqual(actor.anchor, { x: 3, y: 2 });
  assert.equal(cancelled, actor.id);
  assert.equal(cleared, actor.id);
  assert.equal(pendingDiscarded, true);
  assert.equal(game.lastMove, null);
  assert.deepEqual(game.lastWorldEvents, []);

  assert.equal(game.debugTeleportActor(actor.id, { x: 4, y: 2 }), false);
  assert.deepEqual(actor.anchor, { x: 3, y: 2 });

  world.spatial.presencesAt = () => [{ entityId: 3, traits: ["player"] }];
  assert.equal(game.debugTeleportActor(actor.id, { x: 1, y: 1 }), false);
  assert.deepEqual(actor.anchor, { x: 3, y: 2 });
});
