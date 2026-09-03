import test from "node:test";
import assert from "node:assert/strict";
import {
  ORIGINAL_BOBBY_LOCOMOTION_TIMING,
  resolveBobbyLocomotionTiming,
} from "../dist/entities/player/BobbyLocomotion.js";
import { applyMotionEasing } from "../dist/visual/tuning/PresentationTuning.js";
import {
  ORIGINAL_TUNING,
  resolveOriginalTuning,
} from "../dist/visual/tuning/original.js";

test("Bobby owns the canonical original locomotion cadence", () => {
  assert.equal(ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs, 350);
  assert.equal(
    ORIGINAL_TUNING.motion.normalMs,
    ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs,
  );
  assert.equal(
    ORIGINAL_TUNING.motion.speedShoesScale,
    ORIGINAL_BOBBY_LOCOMOTION_TIMING.speedShoesScale,
  );
  assert.equal(ORIGINAL_TUNING.motion.easing, "linear");
});

test("presentation override does not mutate canonical Bobby gameplay timing", () => {
  const presentation = resolveOriginalTuning({
    motion: {
      normalMs: 20,
      easing: "ease-in-out",
    },
  });
  const gameplay = resolveBobbyLocomotionTiming();

  assert.equal(presentation.motion.normalMs, 20);
  assert.equal(gameplay.moveMs, 350);
});

test("Bobby gameplay cadence can be overridden independently from presentation", () => {
  const bobby = resolveBobbyLocomotionTiming({ moveMs: 420 });
  assert.equal(bobby.moveMs, 420);
  assert.equal(ORIGINAL_TUNING.motion.normalMs, 350);
});

test("motion easing remains pure presentation math", () => {
  assert.equal(applyMotionEasing(0.5, "linear"), 0.5);
  assert.equal(applyMotionEasing(0.5, "ease-in"), 0.25);
  assert.equal(applyMotionEasing(0.5, "ease-out"), 0.75);
  assert.equal(applyMotionEasing(0.5, "ease-in-out"), 0.5);
});
