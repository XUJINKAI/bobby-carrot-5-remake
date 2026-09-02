import type { ForcedKind } from "../world/GlobalState.js";

export interface GameplayMotionTiming {
  normalMs: number;
  forcedMs: Readonly<Record<ForcedKind, number>>;
  speedShoesScale: number;
}

export interface GameplayTiming {
  motion: GameplayMotionTiming;
}

export interface GameplayTimingOverride {
  motion?: {
    normalMs?: number;
    forcedMs?: Partial<Record<ForcedKind, number>>;
    speedShoesScale?: number;
  };
}

/** Canonical original gameplay cadence. Presentation defaults to these values but may override them. */
export const ORIGINAL_GAMEPLAY_TIMING: GameplayTiming = {
  motion: {
    normalMs: 180,
    forcedMs: {
      speed: 70,
      ice: 88,
      tide: 132,
      flight: 94,
      leaf: 115,
      "mower-exit": 105,
    },
    speedShoesScale: 0.76,
  },
};

export function resolveGameplayTiming(
  override: GameplayTimingOverride = {},
): GameplayTiming {
  return {
    motion: {
      normalMs:
        override.motion?.normalMs ?? ORIGINAL_GAMEPLAY_TIMING.motion.normalMs,
      forcedMs: {
        ...ORIGINAL_GAMEPLAY_TIMING.motion.forcedMs,
        ...override.motion?.forcedMs,
      },
      speedShoesScale:
        override.motion?.speedShoesScale ??
        ORIGINAL_GAMEPLAY_TIMING.motion.speedShoesScale,
    },
  };
}
