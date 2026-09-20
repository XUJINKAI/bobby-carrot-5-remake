/** 原版 `ta.png` 共享动画相位约每四个 gameplay step 推进一步。 */
export const ORIGINAL_AMBIENT_FRAME_MS = 124;

export function originalAmbientPhase(
  nowMs: number,
  phaseCount: number,
): number {
  if (!Number.isInteger(phaseCount) || phaseCount < 1)
    throw new Error("原版环境动画的相位数必须是正整数");
  return Math.floor(Math.max(0, nowMs) / ORIGINAL_AMBIENT_FRAME_MS) % phaseCount;
}
