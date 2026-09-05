import test from "node:test";
import assert from "node:assert/strict";
import {
  createBuiltinRuntimeActionRegistry,
  createDelayRuntimeAction,
  createDelayedMoveRuntimeAction,
} from "../dist/world/action/builtinActions.js";
import { RuntimeActionScheduler } from "../dist/world/action/RuntimeActionScheduler.js";
import { RuntimeActionRegistry } from "../dist/world/action/RuntimeActionRegistry.js";

const query = {};
const commands = {};

test("RuntimeAction focus owns camera and necessarily blocks controlled input", () => {
  const scheduler = new RuntimeActionScheduler(createBuiltinRuntimeActionRegistry());
  scheduler.start(
    createDelayRuntimeAction(125, {
      ownerEntityId: 7,
      focus: { entityId: 7 },
      reason: "test-motion",
    }),
  );
  assert.equal(scheduler.inputBlocked, true);
  assert.equal(scheduler.cameraTarget, 7);
  assert.equal(scheduler.active.length, 1);

  scheduler.update({ tick: 0, stepMs: 62.5 }, query, commands);
  assert.equal(scheduler.inputBlocked, true);
  scheduler.update({ tick: 1, stepMs: 62.5 }, query, commands);
  assert.equal(scheduler.inputBlocked, false);
  assert.equal(scheduler.cameraTarget, null);
});

test("RuntimeAction may block input without taking camera focus", () => {
  const scheduler = new RuntimeActionScheduler(createBuiltinRuntimeActionRegistry());
  scheduler.start(createDelayRuntimeAction(125, { blocksInput: true }));
  assert.equal(scheduler.inputBlocked, true);
  assert.equal(scheduler.cameraTarget, null);
});

test("owner-scoped RuntimeAction 只阻塞所属 actor", () => {
  const scheduler = new RuntimeActionScheduler(createBuiltinRuntimeActionRegistry());
  scheduler.start(
    createDelayRuntimeAction(125, { ownerEntityId: 7, blocksInput: true }),
  );
  assert.equal(scheduler.isInputBlockedFor(7), true);
  assert.equal(scheduler.isInputBlockedFor(8), false);
});

test("RuntimeAction durations stay in milliseconds when worldHz changes", () => {
  const runFor = (stepMs) => {
    const scheduler = new RuntimeActionScheduler(createBuiltinRuntimeActionRegistry());
    scheduler.start(createDelayRuntimeAction(250, { blocksInput: true }));
    let elapsedMs = 0;
    let tick = 0;
    while (scheduler.inputBlocked && tick < 20) {
      scheduler.update({ tick, stepMs }, query, commands);
      elapsedMs += stepMs;
      tick += 1;
    }
    return elapsedMs;
  };

  assert.equal(runFor(62.5), 250);
  assert.equal(runFor(50), 250);
});

test("RuntimeAction gameplay state is snapshotted and restored deterministically", () => {
  const scheduler = new RuntimeActionScheduler(createBuiltinRuntimeActionRegistry());
  scheduler.start(createDelayRuntimeAction(250, { blocksInput: true }));
  scheduler.update({ tick: 0, stepMs: 62.5 }, query, commands);
  const snapshot = scheduler.snapshot();
  scheduler.update({ tick: 1, stepMs: 62.5 }, query, commands);
  scheduler.update({ tick: 2, stepMs: 62.5 }, query, commands);
  scheduler.restore(snapshot);
  assert.equal(scheduler.inputBlocked, true);
  assert.equal(scheduler.active[0].state.elapsedMs, 62.5);
});

test("delayed move action emits one semantic forced intent and completes", () => {
  const scheduler = new RuntimeActionScheduler(createBuiltinRuntimeActionRegistry());
  scheduler.start(
    createDelayedMoveRuntimeAction(7, "right", 125, {
      mechanism: "ice",
      sourceEntityId: 11,
    }),
  );
  const actionQuery = {
    entity(id) {
      return id === 7 ? { id: 7 } : undefined;
    },
  };

  assert.deepEqual(
    scheduler.update({ tick: 0, stepMs: 62.5 }, actionQuery, commands),
    [],
  );
  assert.equal(scheduler.inputBlocked, true);
  assert.deepEqual(
    scheduler.update({ tick: 1, stepMs: 62.5 }, actionQuery, commands),
    [
      {
        actionId: 1,
        intent: {
          type: "move",
          actorId: 7,
          direction: "right",
          cause: {
            type: "forced",
            sourceEntityId: 11,
            mechanism: "ice",
            cadenceMs: 125,
          },
        },
      },
    ],
  );
  assert.equal(scheduler.inputBlocked, false);
  assert.equal(scheduler.active.length, 0);
});

test("RuntimeAction receives the authoritative MoveResult", () => {
  const registry = new RuntimeActionRegistry();
  registry.register({
    kind: "result-aware-move",
    update({ action }) {
      if (action.state.requested === true) return "running";
      action.state.requested = true;
      return {
        status: "running",
        intents: [
          {
            type: "move",
            actorId: action.ownerEntityId,
            direction: "right",
            cause: { type: "actor" },
          },
        ],
      };
    },
    onIntentResult({ action, result }) {
      action.state.moveSucceeded = result.moved;
    },
  });
  const scheduler = new RuntimeActionScheduler(registry);
  scheduler.start({ kind: "result-aware-move", ownerEntityId: 7 });
  const requests = scheduler.update({ tick: 0, stepMs: 50 }, query, commands);
  scheduler.resolveIntentResults(
    requests,
    [
      {
        actorId: 7,
        moved: false,
        blocked: true,
        from: { x: 0, y: 0 },
        to: { x: 1, y: 0 },
        direction: "right",
        passage: { reason: "blocked", confidence: "rule" },
        events: [],
      },
    ],
    query,
    commands,
  );

  assert.equal(scheduler.active[0].state.moveSucceeded, false);
});
