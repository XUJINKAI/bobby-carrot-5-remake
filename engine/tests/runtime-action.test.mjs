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

function moveIntent(direction = "right") {
  return {
    type: "move",
    actorId: 7,
    direction,
    cause: { type: "actor" },
  };
}

function blockedMoveResult(direction = "right") {
  const to =
    direction === "down"
      ? { x: 0, y: 1 }
      : direction === "left"
        ? { x: -1, y: 0 }
        : direction === "up"
          ? { x: 0, y: -1 }
          : { x: 1, y: 0 };
  return {
    actorId: 7,
    moved: false,
    blocked: true,
    from: { x: 0, y: 0 },
    to,
    direction,
    passage: { reason: "blocked", confidence: "rule" },
    events: [],
  };
}

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

test("delayed move action settles its final semantic intent before completing", () => {
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
  const requests = scheduler.update(
    { tick: 1, stepMs: 62.5 },
    actionQuery,
    commands,
  );
  assert.deepEqual(requests, [
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
  ]);
  assert.equal(scheduler.inputBlocked, true);
  assert.equal(scheduler.active.length, 1);

  scheduler.resolveIntentResults(
    requests,
    [blockedMoveResult("right")],
    actionQuery,
    commands,
  );
  assert.equal(scheduler.inputBlocked, false);
  assert.equal(scheduler.active.length, 0);
});

test("complete RuntimeAction receives its authoritative blocked result before removal", () => {
  const observed = [];
  const registry = new RuntimeActionRegistry();
  registry.register({
    kind: "complete-result-aware",
    update() {
      return { status: "complete", intents: [moveIntent("right")] };
    },
    onIntentResult({ result }) {
      observed.push(result.moved);
    },
  });
  const scheduler = new RuntimeActionScheduler(registry);
  scheduler.start({ kind: "complete-result-aware", ownerEntityId: 7 });

  const requests = scheduler.update({ tick: 0, stepMs: 50 }, query, commands);
  assert.equal(scheduler.active.length, 1);
  scheduler.resolveIntentResults(
    requests,
    [blockedMoveResult("right")],
    query,
    commands,
  );

  assert.deepEqual(observed, [false]);
  assert.equal(scheduler.active.length, 0);
});

test("complete RuntimeAction waits for every emitted intent result", () => {
  const observed = [];
  let updates = 0;
  let observedInputs = 0;
  const registry = new RuntimeActionRegistry();
  registry.register({
    kind: "complete-two-results",
    update() {
      updates += 1;
      return {
        status: "complete",
        intents: [moveIntent("right"), moveIntent("down")],
      };
    },
    onIntent() {
      observedInputs += 1;
      return "consumed";
    },
    onIntentResult({ result }) {
      observed.push(result.direction);
    },
  });
  const scheduler = new RuntimeActionScheduler(registry);
  scheduler.start({
    kind: "complete-two-results",
    ownerEntityId: 7,
    blocksInput: true,
  });

  const requests = scheduler.update({ tick: 0, stepMs: 50 }, query, commands);
  assert.equal(requests.length, 2);
  assert.equal(scheduler.active.length, 1);
  assert.equal(scheduler.inputBlocked, true);
  assert.deepEqual(scheduler.update({ tick: 1, stepMs: 50 }, query, commands), []);
  assert.equal(updates, 1);
  assert.equal(
    scheduler.observeIntents([moveIntent("left")], query),
    "retry",
  );
  assert.equal(observedInputs, 0);

  scheduler.resolveIntentResults(
    [requests[0]],
    [blockedMoveResult("right")],
    query,
    commands,
  );
  assert.deepEqual(observed, ["right"]);
  assert.equal(scheduler.active.length, 1);
  assert.equal(scheduler.inputBlocked, true);

  scheduler.resolveIntentResults(
    [requests[1]],
    [blockedMoveResult("down")],
    query,
    commands,
  );
  assert.deepEqual(observed, ["right", "down"]);
  assert.equal(scheduler.active.length, 0);
  assert.equal(scheduler.inputBlocked, false);
});

test("complete RuntimeAction without result callback finishes normally without onCancel", () => {
  let cancellations = 0;
  const registry = new RuntimeActionRegistry();
  registry.register({
    kind: "complete-no-result-callback",
    update() {
      return { status: "complete", intents: [moveIntent("right")] };
    },
    onCancel() {
      cancellations += 1;
    },
  });
  const scheduler = new RuntimeActionScheduler(registry);
  scheduler.start({ kind: "complete-no-result-callback", ownerEntityId: 7 });

  const requests = scheduler.update({ tick: 0, stepMs: 50 }, query, commands);
  assert.equal(scheduler.active.length, 1);
  scheduler.resolveIntentResults(
    requests,
    [blockedMoveResult("right")],
    query,
    commands,
  );

  assert.equal(cancellations, 0);
  assert.equal(scheduler.active.length, 0);
});

test("cancelling a settling RuntimeAction suppresses remaining result callbacks", () => {
  const results = [];
  const cancellations = [];
  const registry = new RuntimeActionRegistry();
  registry.register({
    kind: "cancel-settling",
    update() {
      return { status: "complete", intents: [moveIntent("right")] };
    },
    onIntentResult({ result }) {
      results.push(result.moved);
    },
    onCancel({ reason }) {
      cancellations.push(reason);
    },
  });
  const scheduler = new RuntimeActionScheduler(registry);
  const actionId = scheduler.start({ kind: "cancel-settling", ownerEntityId: 7 });
  const requests = scheduler.update({ tick: 0, stepMs: 50 }, query, commands);
  assert.equal(scheduler.active.length, 1);

  assert.equal(
    scheduler.cancel(actionId, {
      query,
      commands,
      reason: "owner-inactive",
    }),
    true,
  );
  scheduler.resolveIntentResults(
    requests,
    [blockedMoveResult("right")],
    query,
    commands,
  );

  assert.deepEqual(cancellations, ["owner-inactive"]);
  assert.deepEqual(results, []);
  assert.equal(scheduler.active.length, 0);
});

test("settling RuntimeAction state survives scheduler snapshot restore", () => {
  let updates = 0;
  const registry = new RuntimeActionRegistry();
  registry.register({
    kind: "snapshot-settling",
    update() {
      updates += 1;
      return { status: "complete", intents: [moveIntent("right")] };
    },
  });
  const scheduler = new RuntimeActionScheduler(registry);
  scheduler.start({ kind: "snapshot-settling", ownerEntityId: 7 });
  const requests = scheduler.update({ tick: 0, stepMs: 50 }, query, commands);
  const snapshot = scheduler.snapshot();

  const restored = new RuntimeActionScheduler(registry);
  restored.restore(snapshot);
  assert.equal(restored.active.length, 1);
  assert.deepEqual(restored.update({ tick: 1, stepMs: 50 }, query, commands), []);
  assert.equal(updates, 1);
  restored.resolveIntentResults(
    requests,
    [blockedMoveResult("right")],
    query,
    commands,
  );
  assert.equal(restored.active.length, 0);
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
    [blockedMoveResult("right")],
    query,
    commands,
  );

  assert.equal(scheduler.active[0].state.moveSucceeded, false);
});

test("RuntimeAction cancellation invokes cleanup with an explicit reason", () => {
  const observed = [];
  const registry = new RuntimeActionRegistry();
  registry.register({
    kind: "cancel-aware",
    update() {
      return "running";
    },
    onCancel({ action, reason }) {
      observed.push({ actionId: action.id, reason });
    },
  });
  const scheduler = new RuntimeActionScheduler(registry);
  const actionId = scheduler.start({ kind: "cancel-aware", ownerEntityId: 7 });

  assert.equal(
    scheduler.cancel(actionId, {
      query,
      commands,
      reason: "owner-inactive",
    }),
    true,
  );
  assert.deepEqual(observed, [{ actionId, reason: "owner-inactive" }]);
  assert.equal(scheduler.active.length, 0);
});
