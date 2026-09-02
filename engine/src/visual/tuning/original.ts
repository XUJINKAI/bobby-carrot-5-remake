import { ORIGINAL_GAMEPLAY_TIMING } from "../../time/GameplayTiming.js";
import {
  mergePresentationTuning,
  type PresentationTuning,
  type PresentationTuningOverride,
} from "./PresentationTuning.js";

/**
 * 原版表现默认跟随 canonical gameplay cadence；presentation override 只改变视觉，
 * 不再反向决定 gameplay input lock / movement cadence。
 */
export const ORIGINAL_TUNING: PresentationTuning = {
  motion: {
    normalMs: ORIGINAL_GAMEPLAY_TIMING.motion.normalMs,
    forcedMs: { ...ORIGINAL_GAMEPLAY_TIMING.motion.forcedMs },
    speedShoesScale: ORIGINAL_GAMEPLAY_TIMING.motion.speedShoesScale,
    easing: "linear",
  },
};

export function resolveOriginalTuning(
  override: PresentationTuningOverride = {},
): PresentationTuning {
  return mergePresentationTuning(ORIGINAL_TUNING, override);
}
