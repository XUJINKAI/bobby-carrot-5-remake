import {
  ORIGINAL_BOBBY_LOCOMOTION_TIMING,
} from "../entities/player/BobbyLocomotion.js";
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

/**
 * Transitional aggregate used by Game while automatic mechanics are migrated.
 * Bobby's canonical cadence is owned by entities/player; forced durations will
 * move to their individual RuntimeActions rather than remain in time/.
 */
export const ORIGINAL_GAMEPLAY_TIMING: GameplayTiming = {
  motion: {
    normalMs: ORIGINAL_BOBBY_LOCOMOTION_TIMING.moveMs,
    forcedMs: {
      speed: 70,
      ice: 88,
      tide: 132,
      flight: 94,
      leaf: 115,
      "mower-exit": 105,
    },
    speedShoesScale: ORIGINAL_BOBBY_LOCOMOTION_TIMING.speedShoesScale,
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
