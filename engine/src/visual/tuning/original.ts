import {
  mergePresentationTuning,
  type PresentationTuning,
  type PresentationTuningOverride,
} from "./PresentationTuning.js";

/** Bobby Carrot 5 原版观感的默认表现参数。只包含 presentation timing，不包含 gameplay rule。 */
export const ORIGINAL_TUNING: PresentationTuning = {
  motion: {
    normalMs: 132,
    forcedMs: {
      speed: 70,
      ice: 88,
      tide: 132,
      flight: 94,
      leaf: 115,
      "mower-exit": 105,
    },
    speedShoesScale: 0.76,
    easing: "linear",
  },
};

export function resolveOriginalTuning(
  override: PresentationTuningOverride = {},
): PresentationTuning {
  return mergePresentationTuning(ORIGINAL_TUNING, override);
}
