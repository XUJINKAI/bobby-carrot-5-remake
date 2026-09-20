const DENSITY_AREA = 1_000_000;

export function densityCount(
  width: number,
  height: number,
  perMillionPixels: number,
): number {
  if (perMillionPixels <= 0) return 0;
  return Math.min(
    256,
    Math.max(1, Math.round(width * height / DENSITY_AREA * perMillionPixels)),
  );
}

export function ambientHash01(
  seed: number,
  first: number,
  second: number,
): number {
  let value = (seed ^ Math.imul(first + 1, 0x9e3779b1) ^
    Math.imul(second + 1, 0x85ebca6b)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 0x1_0000_0000;
}
