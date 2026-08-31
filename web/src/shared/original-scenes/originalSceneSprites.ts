export const ORIGINAL_TILE_SIZE = 48;

export const ORIGINAL_SCENE_ASSETS = {
  title: "assets/art/hd/title.png",
  staticTiles: "assets/art/hd/ts.png",
  animatedTiles: "assets/art/hd/ta.png",
  bobbyKite: "assets/art/hd/b9.png",
  train: "assets/art/hd/train.png",
} as const;

/** 原版标题场景使用 ts.png 第 5 行的第 8、9、10 格作为星空素材。 */
export const STAR_ATLAS_CELLS = [
  { column: 7, row: 4 },
  { column: 8, row: 4 },
  { column: 9, row: 4 },
] as const;

/**
 * ta.png 为 4×15 的 48px 图集。最后一行最后两格组成 96×48 区域，
 * 原版标题闪光再把该区域细分为 6×3 个 16px 帧。
 */
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
    x:
      STAR_SPARKLE_SHEET.x +
      (normalized % STAR_SPARKLE_SHEET.columns) * STAR_SPARKLE_SHEET.frameWidth,
    y:
      STAR_SPARKLE_SHEET.y +
      Math.floor(normalized / STAR_SPARKLE_SHEET.columns) *
        STAR_SPARKLE_SHEET.frameHeight,
    width: STAR_SPARKLE_SHEET.frameWidth,
    height: STAR_SPARKLE_SHEET.frameHeight,
  };
}

export function spriteFrameRect(
  imageWidth: number,
  imageHeight: number,
  columns: number,
  rows: number,
  frame: number,
): SpriteRect {
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeRows = Math.max(1, Math.floor(rows));
  const frameCount = safeColumns * safeRows;
  const normalized = Math.max(0, Math.min(frameCount - 1, Math.floor(frame)));
  const width = imageWidth / safeColumns;
  const height = imageHeight / safeRows;
  return {
    x: (normalized % safeColumns) * width,
    y: Math.floor(normalized / safeColumns) * height,
    width,
    height,
  };
}
