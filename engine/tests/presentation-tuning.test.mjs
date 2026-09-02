import test from "node:test";
import assert from "node:assert/strict";
import {
  ORIGINAL_GAMEPLAY_TIMING,
  resolveGameplayTiming,
} from "../dist/time/GameplayTiming.js";
import { applyMotionEasing } from "../dist/visual/tuning/PresentationTuning.js";
import {
  ORIGINAL_TUNING,
  resolveOriginalTuning,
} from "../dist/visual/tuning/original.js";

test("original presentation defaults to canonical gameplay cadence", () => {
  assert.equal(ORIGINAL_GAMEPLAY_TIMING.motion.normalMs, 132);
  assert.equal(ORIGINAL_TUNING.motion.normalMs, ORIGINAL_GAMEPLAY_TIMING.motion.normalMs);
  assert.deepEqual(ORIGINAL_TUNING.motion.forcedMs, ORIGINAL_GAMEPLAY_TIMING.motion.forcedMs);
  assert.equal(
    ORIGINAL_TUNING.motion.speedShoesScale,
    ORIGINAL_GAMEPLAY_TIMING.motion.speedShoesScale,
  );
  assert.equal(ORIGINAL_TUNING.motion.easing, "linear");
});

test("presentation override does not mutate canonical gameplay timing", () => {
  const presentation = resolveOriginalTuning({
    motion: {
      normalMs: 20,
      forcedMs: { ice: 10 },
      easing: "ease-in-out",
    },
  });
  const gameplay = resolveGameplayTiming();

  assert.equal(presentation.motion.normalMs, 20);
  assert.equal(presentation.motion.forcedMs.ice, 10);
  assert.equal(gameplay.motion.normalMs, 132);
  assert.equal(gameplay.motion.forcedMs.ice, 88);
});

test("gameplay timing can be overridden independently from presentation", () => {
  const gameplay = resolveGameplayTiming({
    motion: { normalMs: 150, forcedMs: { speed: 90 } },
  });
  assert.equal(gameplay.motion.normalMs, 150);
  assert.equal(gameplay.motion.forcedMs.speed, 90);
  assert.equal(gameplay.motion.forcedMs.ice, 88);
  assert.equal(ORIGINAL_TUNING.motion.normalMs, 132);
});

test("motion easing remains pure presentation math", () => {
  assert.equal(applyMotionEasing(0.5, "linear"), 0.5);
  assert.equal(applyMotionEasing(0.5, "ease-in"), 0.25);
  assert.equal(applyMotionEasing(0.5, "ease-out"), 0.75);
  assert.equal(applyMotionEasing(0.5, "ease-in-out"), 0.5);
});
