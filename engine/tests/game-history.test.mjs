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
