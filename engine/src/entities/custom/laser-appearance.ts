export interface LaserAppearance {
  color: string;
  widthRatio: number;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

const LASER_COLORS: readonly RgbColor[] = [
  { red: 255, green: 0, blue: 0 },
  { red: 0, green: 112, blue: 255 },
  { red: 190, green: 0, blue: 255 },
];
const MIN_WIDTH_RATIO = 1 / 18;
const MAX_WIDTH_RATIO = 1 / 9;
const MIN_CYCLE_MS = 1_800;
const CYCLE_VARIATION_MS = 1_200;
const UINT32_RANGE = 0x1_0000_0000;

/**
 * 同一发生器的整条光路必须共享表现参数；以 sourceId 派生稳定随机数，
 * 可以区分交叉光路，同时避免重绘、Undo 或 Editor 预览时发生随机跳变。
 */
export function resolveLaserAppearance(
  sourceId: number,
  nowMs: number,
): LaserAppearance {
  const phaseOffset = stableRandom(sourceId, 0x9e37_79b9);
  const cycleMs = MIN_CYCLE_MS +
    stableRandom(sourceId, 0x85eb_ca6b) * CYCLE_VARIATION_MS;
  const colorPhase = normalizedCycle(nowMs / cycleMs + phaseOffset);
  const widthOffset = stableRandom(sourceId, 0xc2b2_ae35);
  const widthPhase = normalizedCycle(colorPhase + widthOffset);
  const widthProgress = (1 - Math.cos(widthPhase * Math.PI * 2)) / 2;

  return {
    color: interpolateCycleColor(colorPhase),
    widthRatio:
      MIN_WIDTH_RATIO + (MAX_WIDTH_RATIO - MIN_WIDTH_RATIO) * widthProgress,
  };
}

function interpolateCycleColor(phase: number): string {
  const position = phase * LASER_COLORS.length;
  const fromIndex = Math.floor(position) % LASER_COLORS.length;
  const toIndex = (fromIndex + 1) % LASER_COLORS.length;
  const progress = position - Math.floor(position);
  const from = LASER_COLORS[fromIndex]!;
  const to = LASER_COLORS[toIndex]!;
  return `rgb(${interpolate(from.red, to.red, progress)}, ${
    interpolate(from.green, to.green, progress)
  }, ${interpolate(from.blue, to.blue, progress)})`;
}

function interpolate(from: number, to: number, progress: number): number {
  return Math.round(from + (to - from) * progress);
}

function normalizedCycle(value: number): number {
  return ((value % 1) + 1) % 1;
}

function stableRandom(sourceId: number, salt: number): number {
  let value = (sourceId >>> 0) ^ salt;
  value = Math.imul(value ^ (value >>> 16), 0x21f0_aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a_2d97);
  value ^= value >>> 15;
  return (value >>> 0) / UINT32_RANGE;
}
