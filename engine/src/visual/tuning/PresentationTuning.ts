import type { ForcedMotionKind } from "../../world/movement/ForcedMotionTiming.js";

export type MotionEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface MotionPresentationTuning {
  normalMs: number;
  forcedMs: Readonly<Record<ForcedMotionKind, number>>;
  speedShoesScale: number;
  easing: MotionEasing;
}

export interface PresentationTuning {
  motion: MotionPresentationTuning;
}

export interface PresentationTuningOverride {
  motion?: {
    normalMs?: number;
    forcedMs?: Partial<Record<ForcedMotionKind, number>>;
    speedShoesScale?: number;
    easing?: MotionEasing;
  };
}

export function mergePresentationTuning(
  base: PresentationTuning,
  override: PresentationTuningOverride = {},
): PresentationTuning {
  return {
    motion: {
      normalMs: override.motion?.normalMs ?? base.motion.normalMs,
      forcedMs: {
        ...base.motion.forcedMs,
        ...override.motion?.forcedMs,
      },
      speedShoesScale:
        override.motion?.speedShoesScale ?? base.motion.speedShoesScale,
      easing: override.motion?.easing ?? base.motion.easing,
    },
  };
}

export function applyMotionEasing(progress: number, easing: MotionEasing): number {
  const t = Math.max(0, Math.min(1, progress));
  if (easing === "ease-in") return t * t;
  if (easing === "ease-out") return 1 - (1 - t) * (1 - t);
  if (easing === "ease-in-out") {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  return t;
}
