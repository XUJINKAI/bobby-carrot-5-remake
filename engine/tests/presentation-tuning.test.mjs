import test from "node:test";
import assert from "node:assert/strict";
import {
  ORIGINAL_TUNING,
  applyMotionEasing,
  resolveOriginalTuning,
} from "../dist/index.js";

test("ORIGINAL_TUNING owns visual motion timing instead of Game literals", () => {
  assert.equal(ORIGINAL_TUNING.motion.normalMs, 132);
  assert.equal(ORIGINAL_TUNING.motion.forcedMs.speed, 70);
  assert.equal(ORIGINAL_TUNING.motion.forcedMs.ice, 88);
  assert.equal(ORIGINAL_TUNING.motion.forcedMs.tide, 132);
  assert.equal(ORIGINAL_TUNING.motion.forcedMs.flight, 94);
  assert.equal(ORIGINAL_TUNING.motion.forcedMs.leaf, 115);
  assert.equal(ORIGINAL_TUNING.motion.forcedMs["mower-exit"], 105);
  assert.equal(ORIGINAL_TUNING.motion.speedShoesScale, 0.76);
  assert.equal(ORIGINAL_TUNING.motion.easing, "linear");
});

test("runtime tuning override is partial and keeps the remaining original profile", () => {
  const tuned = resolveOriginalTuning({
    motion: {
      normalMs: 120,
      forcedMs: { ice: 80 },
      easing: "ease-in-out",
    },
  });
  assert.equal(tuned.motion.normalMs, 120);
  assert.equal(tuned.motion.forcedMs.ice, 80);
  assert.equal(tuned.motion.forcedMs.speed, 70);
  assert.equal(tuned.motion.speedShoesScale, 0.76);
  assert.equal(tuned.motion.easing, "ease-in-out");
  assert.equal(ORIGINAL_TUNING.motion.normalMs, 132);
});

test("motion easing remains pure presentation math", () => {
  assert.equal(applyMotionEasing(0.5, "linear"), 0.5);
  assert.equal(applyMotionEasing(0.5, "ease-in"), 0.25);
  assert.equal(applyMotionEasing(0.5, "ease-out"), 0.75);
  assert.equal(applyMotionEasing(0.5, "ease-in-out"), 0.5);
});
