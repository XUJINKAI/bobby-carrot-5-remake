export const ORIGINAL_TILE_SIZE = 48;

/** Title 与 Gameplay Sky shimmer 共用 ta.png 最后两格中的 16px 帧。 */
export const STAR_SPARKLE_SHEET = {
  x: ORIGINAL_TILE_SIZE * 2,
  y: ORIGINAL_TILE_SIZE * 14,
  width: ORIGINAL_TILE_SIZE * 2,
  height: ORIGINAL_TILE_SIZE,
  columns: 6,
  rows: 3,
  frameWidth: 16,
  frameHeight: 16,
  frameCount: 18,
} as const;

export interface SpriteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function sparkleFrameRect(frame: number): SpriteRect {
  const normalized = Math.max(
    0,
    Math.min(STAR_SPARKLE_SHEET.frameCount - 1, Math.floor(frame)),
  );
  return {
    x: STAR_SPARKLE_SHEET.x +
      (normalized % STAR_SPARKLE_SHEET.columns) *
        STAR_SPARKLE_SHEET.frameWidth,
    y: STAR_SPARKLE_SHEET.y +
      Math.floor(normalized / STAR_SPARKLE_SHEET.columns) *
        STAR_SPARKLE_SHEET.frameHeight,
    width: STAR_SPARKLE_SHEET.frameWidth,
    height: STAR_SPARKLE_SHEET.frameHeight,
  };
}
