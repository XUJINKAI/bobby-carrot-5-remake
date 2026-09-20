import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { RuntimeActionRegistry } from "../dist/world/action/RuntimeActionRegistry.js";
import { World } from "./support/World.mjs";

function move(world, actorId, direction, cause = { type: "player-input" }) {
  return world.step({
    intents: [{ type: "move", actorId, direction, cause }],
  });
}

test("winning World cancels remaining RuntimeActions with world-finished", () => {
  const cancelled = [];
  const actions = new RuntimeActionRegistry();
  actions.register({
    kind: "terminal-watch",
    update() {
      return "running";
    },
    onCancel({ reason }) {
      cancelled.push(reason);
    },
  });
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      rules: { win: { type: "exit" } },
      entities: [
        { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
        { type: MapEntityTypeId.EXIT, x: 1, y: 0 },
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { actions, motionDurationMs: 0 },
  );
  const actor = world.query.entitiesWithFact("player")[0];
  world.startAction({
    kind: "terminal-watch",
    ownerEntityId: actor.id,
    blocksInput: true,
    focus: { entityIds: [actor.id] },
  });
  assert.equal(world.inputBlocked, true);
  assert.deepEqual(world.cameraTargets, [actor.id]);

  const result = move(world, actor.id, "right", {
    type: "forced",
    mechanism: "terminal-test",
  });

  assert.equal(world.completed, true);
  assert.deepEqual(cancelled, ["world-finished"]);
  assert.equal(world.actions.active.length, 0);
  assert.equal(world.inputBlocked, false);
  assert.deepEqual(world.cameraTargets, []);
  assert.ok(
    result.deltas.some(
      (delta) =>
        delta.type === "action-cancelled" && delta.reason === "world-finished",
    ),
  );
});

test("winning RuntimeAction move receives its result before terminal settlement", () => {
  const observedResults = [];
  const cancellations = [];
  const actions = new RuntimeActionRegistry();
  actions.register({
    kind: "terminal-move",
    update({ action }) {
      return {
        status: "complete",
        intents: [
          {
            type: "move",
            actorId: action.ownerEntityId,
            direction: "right",
            cause: { type: "forced", mechanism: "terminal-test" },
          },
        ],
      };
    },
    onIntentResult({ result }) {
      observedResults.push(result.moved);
    },
    onCancel({ reason }) {
      cancellations.push(reason);
    },
  });
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      rules: { win: { type: "exit" } },
      entities: [
        { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
        { type: MapEntityTypeId.EXIT, x: 1, y: 0 },
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { actions, motionDurationMs: 0 },
  );
  const actor = world.query.entitiesWithFact("player")[0];
  world.startAction({ kind: "terminal-move", ownerEntityId: actor.id });

  const result = world.update({ tick: 0, stepMs: 50 });

  assert.equal(result.moves[0]?.moved, true);
  assert.equal(world.completed, true);
  assert.deepEqual(observedResults, [true]);
  assert.deepEqual(cancellations, []);
  assert.equal(world.actions.active.length, 0);
});

test("losing World interrupts a running WorldMotion at its current progress", () => {
  const world = new World(
    {
      schemaVersion: 1,
      width: 2,
      height: 1,
      rules: { limits: [{ type: "max-time-seconds", seconds: 0.05 }] },
      entities: [
        { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
        { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
        { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      ],
    },
    { motionDurationMs: 100 },
  );
  const actor = world.query.entitiesWithFact("player")[0];
  const started = move(world, actor.id, "right");
  assert.equal(started.moves[0].moved, true);
  assert.equal(world.movement.running.length, 1);

  const lost = world.update({ tick: 1, stepMs: 60 });
  const motion = world.movement.motions.forEntity(actor.id);

  assert.equal(world.dead, true);
  assert.equal(world.movement.running.length, 0);
  assert.equal(world.inputBlocked, false);
  assert.equal(motion?.status, "interrupted");
  assert.equal(motion?.progress, 0.6);
  assert.equal(motion?.interruption?.reason, "world-finished");
  assert.ok(
    lost.deltas.some(
      (delta) =>
        delta.type === "motion-interrupted" &&
        delta.motion.entityId === actor.id &&
        delta.motion.interruption?.reason === "world-finished",
    ),
  );
});
