import { ORIGINAL_BOBBY_LOCOMOTION_TIMING } from "../../entities/player/BobbyLocomotion.js";
import {
  mergePresentationTuning,
  type PresentationTuning,
  type PresentationTuningOverride,
} from "./PresentationTuning.js";

/**
 * 原版表现默认跟随 Bobby 的 canonical locomotion cadence；presentation override
 * 只改变视觉，不再反向决定 gameplay input lock / movement cadence。
 */
export const ORIGINAL_TUNING: PresentationTuning = {
  motion: {
    normalMs: ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs,
    easing: "linear",
  },
};

export function resolveOriginalTuning(
  override: PresentationTuningOverride = {},
): PresentationTuning {
  return mergePresentationTuning(ORIGINAL_TUNING, override);
}
