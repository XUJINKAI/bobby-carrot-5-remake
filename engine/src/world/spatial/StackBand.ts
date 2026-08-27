export type StackBand = "surface" | "content" | "cover";

export const STACK_BANDS: readonly StackBand[] = [
  "surface",
  "content",
  "cover",
] as const;

export function stackBandOrder(band: StackBand): number {
  return STACK_BANDS.indexOf(band);
}
