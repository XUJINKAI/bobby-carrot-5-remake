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

test("Debug pause freezes WorldClock and restores prior InputController state", () => {
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
  game.debugInputEnabledBeforePause = null;
  game.heldDirection = "right";
  game.heldDirectionBlocked = true;
  game.render = () => {};

  game.pauseDebugClock();
  assert.equal(paused, true);
  assert.equal(inputEnabled, false);
  assert.equal(game.heldDirection, null);
  assert.equal(game.heldDirectionBlocked, false);

  game.resumeDebugClock();
  assert.equal(paused, false);
  assert.equal(inputEnabled, true);
  assert.deepEqual(inputTransitions, [false, true]);
  assert.equal(game.debugInputEnabledBeforePause, null);
});

test("Debug pause does not enable input that was already disabled by the host", () => {
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
  game.debugInputEnabledBeforePause = null;
  game.heldDirection = null;
  game.heldDirectionBlocked = false;
  game.render = () => {};

  game.pauseDebugClock();
  game.resumeDebugClock();
  assert.equal(inputEnabled, false);
});
