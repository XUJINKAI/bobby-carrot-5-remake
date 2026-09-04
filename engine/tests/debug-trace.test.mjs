import test from "node:test";
import assert from "node:assert/strict";
import { DebugTraceRecorder } from "../dist/debug/DebugTrace.js";

test("Debug trace 同时保留观察顺序、WorldDelta 顺序和双时钟位置", () => {
  const recorder = new DebugTraceRecorder(2);
  recorder.record({
    category: "motion",
    summary: "marker interaction",
    worldTick: 7,
    worldTimeMs: 437.5,
    worldSequence: 12,
    presentationFrame: 26,
  });
  recorder.record({
    category: "lifecycle",
    summary: "#3 downed",
    worldTick: 7,
    worldTimeMs: 437.5,
    worldSequence: 13,
    presentationFrame: 26,
  });

  assert.deepEqual(
    recorder.snapshot().map((entry) => ({
      seq: entry.seq,
      worldSequence: entry.worldSequence,
      worldTick: entry.worldTick,
      presentationFrame: entry.presentationFrame,
    })),
    [
      { seq: 1, worldSequence: 12, worldTick: 7, presentationFrame: 26 },
      { seq: 2, worldSequence: 13, worldTick: 7, presentationFrame: 26 },
    ],
  );
});
