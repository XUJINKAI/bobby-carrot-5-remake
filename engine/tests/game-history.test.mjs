import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../dist/core/Game.js";

test("Game undo 与 redo 往返恢复 World 和地图内计时快照", () => {
  let worldState = { player: { x: 2, y: 0 } };
  let challengeState = 4_000;
  const game = Object.create(Game.prototype);
  game.worldValue = {
    snapshot: () => structuredClone(worldState),
    restore: (snapshot) => {
      worldState = structuredClone(snapshot);
    },
  };
  game.timedChallenge = {
    snapshot: () => challengeState,
    restore: (snapshot) => {
      challengeState = snapshot;
    },
  };
  game.history = [
    {
      world: { player: { x: 1, y: 0 } },
      timedChallengeRemainingMs: 5_000,
    },
  ];
  game.future = [];
  game.syncVisualToWorld = () => {};
  game.render = () => {};
  game.emit = () => {};

  assert.equal(game.canUndo, true);
  assert.equal(game.canRedo, false);
  assert.equal(game.undo(), true);
  assert.deepEqual(worldState.player, { x: 1, y: 0 });
  assert.equal(challengeState, 5_000);
  assert.equal(game.canRedo, true);

  assert.equal(game.redo(), true);
  assert.deepEqual(worldState.player, { x: 2, y: 0 });
  assert.equal(challengeState, 4_000);
  assert.equal(game.canRedo, false);
});
