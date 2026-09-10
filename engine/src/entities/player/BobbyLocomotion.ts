export interface BobbyLocomotionTiming {
  /** Bobby 完成一次普通整格移动所需的 gameplay 时间。 */
  moveMs: number;
}

export interface BobbyLocomotionTimingOverride {
  moveMs?: number;
}

/** 原版 Bobby 的基准移动节奏。 */
export const ORIGINAL_BOBBY_LOCOMOTION_TIMING: BobbyLocomotionTiming = {
  moveMs: 350,
};

export function resolveBobbyLocomotionTiming(
  override: BobbyLocomotionTimingOverride = {},
): BobbyLocomotionTiming {
  return {
    moveMs: positiveMs(
      override.moveMs ?? ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs,
      ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs,
    ),
  };
}

function positiveMs(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
