import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../dist/core/Game.js";

test("Game undo 与 redo往返恢复 canonical gameplay snapshot", () => {
  let worldState = {
    entities: [{ id: 1, type: "bobby", anchor: { x: 2, y: 0 } }],
    globals: { moves: 2 },
  };
  const game = Object.create(Game.prototype);
  game.worldValue = {
    snapshot: () => structuredClone(worldState),
    restore: (snapshot) => {
      worldState = structuredClone(snapshot);
    },
  };
  game.history = [
    {
      entities: [{ id: 1, type: "bobby", anchor: { x: 1, y: 0 } }],
      globals: { moves: 1 },
    },
  ];
  game.future = [];
  game.visual = { clear() {} };
  game.render = () => {};
  game.emit = () => {};

  assert.equal(game.canUndo, true);
  assert.equal(game.canRedo, false);
  game.undo();
  assert.deepEqual(worldState.entities[0].anchor, { x: 1, y: 0 });
  assert.equal(worldState.globals.moves, 1);
  assert.equal(game.canRedo, true);

  game.redo();
  assert.deepEqual(worldState.entities[0].anchor, { x: 2, y: 0 });
  assert.equal(worldState.globals.moves, 2);
  assert.equal(game.canRedo, false);
});

test("WorldClock pause blocks direct Game.move gameplay bypass", () => {
  const game = Object.create(Game.prototype);
  let moved = false;
  game.worldValue = {
    dead: false,
    completed: false,
    inputBlocked: false,
  };
  game.worldClock = { paused: true };
  game.startLogicalMove = () => {
    moved = true;
    return {};
  };
  game.render = () => {};

  assert.equal(game.move("right"), null);
  assert.equal(moved, false);
});

test("Debug pause freezes only WorldClock and preserves input plus held state", () => {
  const game = Object.create(Game.prototype);
  let paused = false;
  let inputEnabled = true;
  const inputTransitions = [];
  game.worldClock = {
    get paused() {
      return paused;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
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
  game.worldClock = {
    get paused() {
      return paused;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
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
  const actor = { id: 2, type: "bobby", anchor: { x: 0, y: 0 }, direction: "right" };
  let moved = null;
  let cancelled = null;
  let cleared = null;
  game.debugValue = true;
  game.worldValue = {
    query: {
      entitiesWithTrait: (trait) => (trait === "player" ? [actor] : []),
    },
    entities: {
      get: (id) => (id === actor.id ? actor : undefined),
    },
    definition: () => ({ footprint: undefined }),
    spatial: {
      inBounds: ({ x, y }) => x >= 0 && y >= 0 && x < 4 && y < 3,
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
  };
  game.visual = {
    clearEntity: (id) => {
      cleared = id;
    },
  };
  game.debugExternalActorId = null;
  game.inputController = null;
  game.pendingHistorySnapshot = { pending: true };
  game.lastMove = { moved: true };
  game.lastWorldEvents = [{ type: "message", message: "old" }];

  assert.equal(game.debugTeleportActor(actor.id, { x: 3, y: 2 }), true);
  assert.deepEqual(moved, { id: actor.id, cell: { x: 3, y: 2 } });
  assert.deepEqual(actor.anchor, { x: 3, y: 2 });
  assert.equal(cancelled, actor.id);
  assert.equal(cleared, actor.id);
  assert.equal(game.pendingHistorySnapshot, null);
  assert.equal(game.lastMove, null);
  assert.deepEqual(game.lastWorldEvents, []);

  assert.equal(game.debugTeleportActor(actor.id, { x: 4, y: 2 }), false);
  assert.deepEqual(actor.anchor, { x: 3, y: 2 });
});
