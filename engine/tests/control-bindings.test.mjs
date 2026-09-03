import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveControlInput,
  transformDirection,
} from "../dist/input/ControlBindings.js";
import { shouldCheckpoint } from "../dist/core/HistoryPolicy.js";

test("one control channel can mirror two actors", () => {
  const group = resolveControlInput(
    [
      {
        input: "arrows",
        targets: [
          { entityId: 1 },
          { entityId: 2, directionTransform: "mirror-x" },
        ],
      },
    ],
    "arrows",
    "right",
  );
  assert.deepEqual(
    group.intents.map(({ actorId, direction }) => [actorId, direction]),
    [[1, "right"], [2, "left"]],
  );
  assert.equal(transformDirection("up", "mirror-x"), "up");
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
