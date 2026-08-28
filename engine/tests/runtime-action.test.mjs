import test from "node:test";
import assert from "node:assert/strict";
import {
  createBuiltinRuntimeActionRegistry,
  createDelayRuntimeAction,
} from "../dist/world/action/builtinActions.js";
import { RuntimeActionScheduler } from "../dist/world/action/RuntimeActionScheduler.js";

const query = {};
const commands = {};

test("RuntimeActionScheduler derives blocking and camera policy from active actions", () => {
  const scheduler = new RuntimeActionScheduler(createBuiltinRuntimeActionRegistry());
  scheduler.start(
    createDelayRuntimeAction(125, {
      ownerEntityId: 7,
      blocksInput: true,
      cameraTarget: 7,
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
