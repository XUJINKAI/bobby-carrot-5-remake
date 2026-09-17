import { BOBBY_MOVEMENT } from "../movement/MovementCadence.js";

export interface BobbyLocomotionTiming {
  /** Bobby 完成一次普通整格移动所需的 gameplay 时间。 */
  moveMs: number;
}

export interface BobbyLocomotionTimingOverride {
  moveMs?: number;
}

/** Bobby Carrot 5 Remake 的默认普通移动节拍。 */
export const ORIGINAL_BOBBY_LOCOMOTION_TIMING: BobbyLocomotionTiming = {
  moveMs: BOBBY_MOVEMENT.normalCellMs,
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
