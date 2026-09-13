export type MotionEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface MotionPresentationTuning {
  normalMs: number;
  easing: MotionEasing;
}

export interface LevelTransitionPresentationTuning {
  /** 从载入关卡到 Bobby 恢复普通站立表现的持续时间。 */
  enterMs: number;
  /** 从关卡胜利到 Bobby 完全隐藏的持续时间。 */
  exitMs: number;
}

export interface PresentationTuning {
  motion: MotionPresentationTuning;
  levelTransition: LevelTransitionPresentationTuning;
}

export interface PresentationTuningOverride {
  motion?: {
    normalMs?: number;
    easing?: MotionEasing;
  };
  levelTransition?: {
    enterMs?: number;
    exitMs?: number;
  };
}

export function mergePresentationTuning(
  base: PresentationTuning,
  override: PresentationTuningOverride = {},
): PresentationTuning {
  return {
    motion: {
      normalMs: override.motion?.normalMs ?? base.motion.normalMs,
      easing: override.motion?.easing ?? base.motion.easing,
    },
    levelTransition: {
      enterMs:
        override.levelTransition?.enterMs ?? base.levelTransition.enterMs,
      exitMs: override.levelTransition?.exitMs ?? base.levelTransition.exitMs,
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
