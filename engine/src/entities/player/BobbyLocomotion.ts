export interface BobbyLocomotionTiming {
  /** One ordinary grid move by Bobby in gameplay time. */
  moveMs: number;
  /** Adventure speed-shoes capability scales Bobby locomotion only. */
  speedShoesScale: number;
}

export interface BobbyLocomotionTimingOverride {
  moveMs?: number;
  speedShoesScale?: number;
}

/** Canonical original Bobby locomotion cadence. */
export const ORIGINAL_BOBBY_LOCOMOTION_TIMING: BobbyLocomotionTiming = {
  moveMs: 350,
  speedShoesScale: 0.76,
};

export function resolveBobbyLocomotionTiming(
  override: BobbyLocomotionTimingOverride = {},
): BobbyLocomotionTiming {
  return {
    moveMs: positiveMs(
      override.moveMs ?? ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs,
      ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs,
    ),
    speedShoesScale: positiveScale(
      override.speedShoesScale ??
        ORIGINAL_BOBBY_LOCOMOTION_TIMING.speedShoesScale,
      ORIGINAL_BOBBY_LOCOMOTION_TIMING.speedShoesScale,
    ),
  };
}

function positiveMs(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function positiveScale(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
