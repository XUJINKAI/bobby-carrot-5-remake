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
  levelTransition: {
    // 原版载入路径在本轮 animation advance 结束后才建立倒播状态。
    enterMs: 10 * 31,
    // 原版胜利路径会在建立正播状态的同一轮立即 advance 一次。
    exitMs: 9 * 31,
  },
};

export function resolveOriginalTuning(
  override: PresentationTuningOverride = {},
): PresentationTuning {
  return mergePresentationTuning(ORIGINAL_TUNING, override);
}
