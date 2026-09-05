import test from "node:test";
import assert from "node:assert/strict";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";

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
  const runtime = new VisualRuntime({}, 48);
  const started = {
    id: 1,
    kind: "move",
    entityId: 7,
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
    {},
    [delta(1, "motion-started", started)],
    { frame: 0, nowMs: 1000, deltaMs: 0 },
    options,
  );
  runtime.update({ frame: 1, nowMs: 1050, deltaMs: 50 }, "linear");
  assert.equal(runtime.runtimeStates.get(7).offsetX, -0.5);

  const interrupted = {
    ...started,
    elapsedMs: 50,
    progress: 0.5,
    status: "interrupted",
    interruption: { reason: "trap" },
  };
  runtime.consumeWorldDeltas(
    {},
    [delta(2, "motion-interrupted", interrupted)],
    { frame: 1, nowMs: 1050, deltaMs: 0 },
    options,
  );

  const atInterruption = runtime.runtimeStates.get(7);
  assert.equal(atInterruption.offsetX, -0.5);
  assert.equal(atInterruption.offsetY, 0);
  assert.equal(atInterruption.moving, false);
  assert.equal(atInterruption.animation, "death");
  assert.equal(atInterruption.progress, 0);

  runtime.update({ frame: 2, nowMs: 1100, deltaMs: 50 }, "linear");
  assert.equal(runtime.runtimeStates.get(7).offsetX, -0.5);
});
