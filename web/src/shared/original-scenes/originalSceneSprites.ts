import {
  ORIGINAL_TILE_SIZE,
  STAR_SPARKLE_SHEET,
  sparkleFrameRect,
  type OriginalAmbientSpriteRect as SpriteRect,
} from "@bobby/engine";

export { ORIGINAL_TILE_SIZE, STAR_SPARKLE_SHEET, sparkleFrameRect };

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
