export type ForcedMotionKind =
  | "speed"
  | "ice"
  | "tide"
  | "flight"
  | "leaf"
  | "mower-exit";

/**
 * Transitional canonical cadence for automatic movement mechanics.
 * Each mechanic will own its duration once its RuntimeAction is implemented.
 */
export const ORIGINAL_FORCED_MOTION_MS: Readonly<
  Record<ForcedMotionKind, number>
> = {
  speed: 70,
  ice: 88,
  tide: 132,
  flight: 94,
  leaf: 115,
  "mower-exit": 105,
};

export type ForcedMotionTimingOverride = Partial<
  Record<ForcedMotionKind, number>
>;

export function resolveForcedMotionMs(
  kind: ForcedMotionKind,
  override: ForcedMotionTimingOverride = {},
): number {
  const value = override[kind] ?? ORIGINAL_FORCED_MOTION_MS[kind];
  return Number.isFinite(value) && value > 0
    ? value
    : ORIGINAL_FORCED_MOTION_MS[kind];
}
