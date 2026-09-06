import test from "node:test";
import assert from "node:assert/strict";
import { WorldDeltaSequence } from "../dist/world/delta/WorldDelta.js";
import { MovementRuntime } from "../dist/world/movement/MovementRuntime.js";
import { WorldMotionStore } from "../dist/world/movement/WorldMotion.js";

const move = {
  entityId: 7,
  from: { x: 1, y: 2 },
  to: { x: 2, y: 2 },
  direction: "right",
  cause: { type: "player-input", source: "test" },
  durationMs: 350,
};

test("WorldMotion 保留整数 anchor 之外的连续 gameplay pose", () => {
  const motions = new WorldMotionStore();
  const motion = motions.start(move);
  const mutable = motions.mutable(motion.id);
  mutable.elapsedMs = 175;
  mutable.progress = 0.5;

  assert.deepEqual(motions.poseFor(7, { x: 2, y: 2 }), { x: 1.5, y: 2 });
  const interrupted = motions.interruptEntity(7, "trap");
  assert.equal(interrupted.status, "interrupted");
  assert.equal(interrupted.progress, 0.5);
});

test("WorldMotion snapshot 可确定性恢复中断位置", () => {
  const motions = new WorldMotionStore();
  const motion = motions.start(move);
  motions.interruptEntity(7, "trap", 0.5);
  const snapshot = motions.snapshot();

  motions.clear();
  motions.restore(snapshot);
  assert.deepEqual(motions.forEntity(7), {
    ...motion,
    elapsedMs: 175,
    progress: 0.5,
    status: "interrupted",
    interruption: { reason: "trap" },
  });
});

test("WorldDelta 使用独立 sequence 保存跨时钟因果顺序", () => {
  const sequence = new WorldDeltaSequence();
  const clock = { worldTick: 4, worldTimeMs: 250 };
  const first = sequence.create(
    { type: "motion-started", motion: { ...move, id: 1, elapsedMs: 0, progress: 0, status: "running", kind: "move" } },
    clock,
  );
  const second = sequence.create(
    { type: "motion-marker", motion: first.motion, marker: "interaction" },
    clock,
  );

  assert.equal(first.sequence, 1);
  assert.equal(second.sequence, 2);
  assert.equal(second.worldTick, 4);
});

test("MovementRuntime uses per-plan markers with stable same-progress order", () => {
  const runtime = new MovementRuntime();
  runtime.start(
    {
      entityId: move.entityId,
      from: move.from,
      to: move.to,
      direction: move.direction,
      cause: move.cause,
    },
    100,
    {
      source: [],
      target: [],
      markers: [
        { id: "late", progress: 0.75 },
        { id: "first", progress: 0.25 },
        { id: "second", progress: 0.25 },
      ],
    },
  );
  const markers = [];
  const visitor = {
    progressed() {},
    marker(_motion, marker) {
      markers.push(marker.id);
    },
    completed() {},
  };

  runtime.advance(25, visitor);
  assert.deepEqual(markers, ["first", "second"]);
  runtime.advance(50, visitor);
  assert.deepEqual(markers, ["first", "second", "late"]);
  assert.deepEqual(
    runtime.snapshot().plans[0].markers.map((marker) => marker.id),
    ["first", "second", "late"],
  );
});
