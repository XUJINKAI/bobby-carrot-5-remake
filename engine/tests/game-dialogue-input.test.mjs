import assert from "node:assert/strict";
import test from "node:test";
import { GameDialogueInput } from "../dist/core/GameDialogueInput.js";

function fixture() {
  const actors = new Map([
    [7, { id: 7, anchor: { x: 2, y: 3 }, direction: "right" }],
  ]);
  const busy = new Set();
  return {
    actors,
    busy,
    world: {
      dead: false,
      completed: false,
      entity: (id) => actors.get(id),
      query: { entityHasFact: (id) => actors.has(id) },
      isInputBlockedFor: (id) => busy.has(id),
    },
  };
}

test("对话方向由发起者到接触格决定", () => {
  const { world } = fixture();
  const input = new GameDialogueInput();
  assert.equal(input.directionFor(world, {
    actorId: 7, x: 2, y: 2,
  }), "up");
  assert.equal(input.directionFor(world, {
    actorId: 7, x: 4, y: 3,
  }), "right");
  assert.equal(input.directionFor(world, {
    actorId: 7, x: 2, y: 3,
  }), "right");
});

test("对话关闭后的移动等 Bobby 运动结束再提交", () => {
  const { world, busy } = fixture();
  const input = new GameDialogueInput();
  busy.add(7);
  input.queue(world, 7, "left");
  assert.deepEqual(input.ready(world), []);

  busy.delete(7);
  assert.deepEqual(input.ready(world), [{
    intents: [{
      type: "move",
      actorId: 7,
      direction: "left",
      cause: {
        type: "player-input",
        source: "dialogue",
        inputDirection: "left",
      },
    }],
    historyBoundary: true,
  }]);
  assert.deepEqual(input.ready(world), []);
});
