import test from "node:test";
import assert from "node:assert/strict";
import { EntityTypeId } from "@bobby/model";
import { createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import { World } from "../dist/world/World.js";

function delta(sequence, type, motion) {
  return {
    sequence,
    worldTick: 1,
    worldTimeMs: 50,
    type,
    motion,
  };
}

test("motion interruption keeps the current authoritative visual position", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      { type: "grass", variant: "ts-10-1", x: 0, y: 0 },
      { type: "grass", variant: "ts-10-1", x: 1, y: 0 },
      { type: EntityTypeId.BOBBY, x: 1, y: 0, direction: "right" },
    ],
  });
  const actor = world.query.entitiesWithTrait("player")[0];
  assert.ok(actor);
  const runtime = new VisualRuntime(createBuiltinVisualRegistry(), 48);
  const started = {
    id: 1,
    kind: "move",
    entityId: actor.id,
    from: { x: 0, y: 0 },
    to: { x: 1, y: 0 },
    direction: "right",
    cause: { type: "player-input", source: "test" },
    durationMs: 100,
    elapsedMs: 0,
    progress: 0,
    status: "running",
  };
  const options = {
    motionDuration: () => 100,
    stationaryDeathDurationMs: 100,
  };

  runtime.consumeWorldDeltas(
    world,
    [delta(1, "motion-started", started)],
    { frame: 0, nowMs: 1000, deltaMs: 0 },
    options,
  );
  runtime.update({ frame: 1, nowMs: 1050, deltaMs: 50 }, "linear");
  assert.equal(runtime.runtimeStates.get(actor.id).offsetX, -0.5);

  const interrupted = {
    ...started,
    elapsedMs: 50,
    progress: 0.5,
    status: "interrupted",
    interruption: { reason: "trap" },
  };
  runtime.consumeWorldDeltas(
    world,
    [delta(2, "motion-interrupted", interrupted)],
    { frame: 1, nowMs: 1050, deltaMs: 0 },
    options,
  );

  const atInterruption = runtime.runtimeStates.get(actor.id);
  assert.equal(atInterruption.offsetX, -0.5);
  assert.equal(atInterruption.offsetY, 0);
  assert.equal(atInterruption.moving, false);
  assert.equal(atInterruption.animation, "death");
  assert.equal(atInterruption.progress, 0);

  runtime.update({ frame: 2, nowMs: 1100, deltaMs: 50 }, "linear");
  assert.equal(runtime.runtimeStates.get(actor.id).offsetX, -0.5);
});
