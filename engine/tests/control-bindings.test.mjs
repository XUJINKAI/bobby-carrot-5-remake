import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveControlInput,
  transformDirection,
} from "../dist/input/ControlBindings.js";
import { GameplaySession } from "../dist/core/GameplaySession.js";
import { shouldCheckpoint } from "../dist/core/HistoryPolicy.js";

test("one control channel can mirror two actors", () => {
  const group = resolveControlInput(
    [
      { entityId: 1, channel: 0 },
      { entityId: 2, channel: 0, directionTransform: { mirrorX: true } },
    ],
    0,
    "right",
    "arrows",
  );
  assert.deepEqual(
    group.intents.map(({ actorId, direction }) => [actorId, direction]),
    [[1, "right"], [2, "left"]],
  );
  assert.equal(transformDirection("up", { mirrorX: true }), "up");
});

test("horizontal and vertical mirrors compose freely", () => {
  const both = { mirrorX: true, mirrorY: true };
  assert.equal(transformDirection("up", both), "down");
  assert.equal(transformDirection("right", both), "left");
  assert.equal(
    transformDirection("up", { quarterTurns: 1, mirrorX: true }),
    "left",
  );
});

const ground = (x) => ({ type: "grass", variant: "ts-10-1", x, y: 0 });

test("Bobby controller fields derive linked and split input bindings", () => {
  const session = new GameplaySession();
  session.loadLevel({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ground(0), ground(1), ground(2), ground(3),
      { type: "bobby", x: 0, y: 0, controller: 0 },
      {
        type: "bobby",
        x: 3,
        y: 0,
        controller: 0,
        mirrorX: true,
        mirrorY: true,
      },
    ],
  });
  const arrows = session.controls.find((binding) => binding.input === "arrows");
  const wasd = session.controls.find((binding) => binding.input === "wasd");
  assert.equal(arrows.channel, 0);
  assert.equal(wasd.channel, 0);
  assert.deepEqual(
    session.resolveControllerInput(0, "right").intents.map(
      ({ actorId, direction }) => [actorId, direction],
    ),
    [[5, "right"], [6, "left"]],
  );

  session.loadLevel({
    schemaVersion: 1,
    width: 4,
    height: 1,
    entities: [
      ground(0), ground(1), ground(2), ground(3),
      { type: "bobby", x: 0, y: 0, controller: 0 },
      { type: "bobby", x: 3, y: 0, controller: 1 },
    ],
  });
  const splitArrows = session.controls.find((binding) => binding.input === "arrows");
  const splitWasd = session.controls.find((binding) => binding.input === "wasd");
  assert.equal(splitArrows.channel, 0);
  assert.equal(splitWasd.channel, 1);
});

test("world-change history ignores pure controlled movement but checkpoints puzzle mutation", () => {
  const base = {
    moves: [{ actorId: 1, moved: true }],
    motions: [],
    events: [],
    mutations: {
      moved: [1],
      stateChanged: [],
      spawned: [],
      destroyed: [],
      globalsChanged: ["moves"],
      actionsStarted: [],
      actionsCancelled: [],
    },
  };
  assert.equal(shouldCheckpoint({ mode: "world-change" }, base, [1]), false);
  assert.equal(
    shouldCheckpoint(
      { mode: "world-change" },
      { ...base, mutations: { ...base.mutations, moved: [1, 9] } },
      [1],
    ),
    true,
  );
  assert.equal(
    shouldCheckpoint(
      { mode: "world-change" },
      { ...base, mutations: { ...base.mutations, destroyed: [9] } },
      [1],
    ),
    true,
  );
});
