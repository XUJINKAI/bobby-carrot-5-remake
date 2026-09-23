import type { ImageManager } from "../image/ImageManager.js";
import type {
  AtlasVisualLayer,
  ImageVisualLayer,
  VisualComposition,
} from "../visual/VisualDefinition.js";
import {
  snapRectToDevicePixels,
  type PixelRect,
} from "./CanvasPixelGeometry.js";

export function drawVisualComposition(
  context: CanvasRenderingContext2D,
  images: ImageManager,
  composition: VisualComposition | null,
  left: number,
  top: number,
  tileSize: number,
  deviceScale = 1,
  viewport?: PixelRect,
): void {
  if (!composition) return;
  const cell = snapRectToDevicePixels(
    left,
    top,
    left + tileSize,
    top + tileSize,
    deviceScale,
  );
  for (const layer of composition.layers) {
    if (layer.kind === "canvas") {
      layer.draw(context, cell.x, cell.y, Math.min(cell.width, cell.height));
    } else if (layer.kind === "image") {
      drawImageLayer(
        context,
        images,
        layer,
        cell,
        tileSize,
        deviceScale,
        viewport,
      );
    } else {
      drawAtlasLayer(
        context,
        images,
        layer,
        left,
        top,
        tileSize,
        deviceScale,
        viewport,
      );
    }
  }
}

function drawImageLayer(
  context: CanvasRenderingContext2D,
  images: ImageManager,
  layer: ImageVisualLayer,
  cell: PixelRect,
  tileSize: number,
  deviceScale: number,
  viewport?: PixelRect,
): void {
  const image = images.image(layer.asset);
  if (!image) return;
  const requestedColumns = positiveInteger(layer.frameColumns);
  const requestedRows = positiveInteger(layer.frameRows);
  const frameWidth = Math.max(
    1,
    layer.frameWidth ?? image.width / (requestedColumns ?? 1),
  );
  const frameHeight = Math.max(
    1,
    layer.frameHeight ?? image.height / (requestedRows ?? 1),
  );
  const columns =
    requestedColumns ?? Math.max(1, Math.floor(image.width / frameWidth));
  const rows =
    requestedRows ?? Math.max(1, Math.floor(image.height / frameHeight));
  const frameCount = Math.max(1, columns * rows);
  const progress = Math.max(0, Math.min(0.999999, layer.frameProgress ?? 0));
  const requestedFrame = layer.frameIndex ?? Math.floor(progress * frameCount);
  const frame = Math.max(0, Math.min(frameCount - 1, requestedFrame));
  const sourceX = layer.sourceX ?? (frame % columns) * frameWidth;
  const sourceY = layer.sourceY ?? Math.floor(frame / columns) * frameHeight;

  if (layer.anchor === "fill") {
    if (!intersectsViewport(cell, viewport)) return;
    context.drawImage(
      image,
      sourceX,
      sourceY,
      frameWidth,
      frameHeight,
      cell.x,
      cell.y,
      cell.width,
      cell.height,
    );
    return;
  }

  const scale = tileSize / (
    positiveInteger(layer.sourceTileSize) ?? images.sourceTileSize
  );
  const drawWidth = frameWidth * scale;
  const drawHeight = frameHeight * scale;
  const drawX = (layer.anchor === "top-left"
    ? cell.x
    : cell.x + cell.width / 2 - drawWidth / 2) +
    (layer.offsetX ?? 0) * scale;
  const drawY =
    (layer.anchor === "top-left"
      ? cell.y
      : layer.anchor === "center"
      ? cell.y + cell.height / 2 - drawHeight / 2
      : cell.y + cell.height - drawHeight) +
    (layer.offsetY ?? 0) * scale;
  const drawRect = snapRectToDevicePixels(
    drawX,
    drawY,
    drawX + drawWidth,
    drawY + drawHeight,
    deviceScale,
  );
  if (!intersectsViewport(drawRect, viewport)) return;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    frameWidth,
    frameHeight,
    drawRect.x,
    drawRect.y,
    drawRect.width,
    drawRect.height,
  );
}

function drawAtlasLayer(
  context: CanvasRenderingContext2D,
  images: ImageManager,
  layer: AtlasVisualLayer,
  left: number,
  top: number,
  tileSize: number,
  deviceScale: number,
  viewport?: PixelRect,
): void {
  const atlas = images.image(images.atlasId);
  if (!atlas) return;
  const sourceTile = images.sourceTileSize;
  const columns = positiveInteger(layer.columns) ?? 1;
  const rows = positiveInteger(layer.rows) ?? 1;
  const scale = tileSize / sourceTile;
  const drawWidth = columns * tileSize;
  const drawHeight = rows * tileSize;
  const drawX =
    left + tileSize / 2 - drawWidth / 2 + (layer.offsetX ?? 0) * scale;
  const drawY =
    (layer.anchor === "bottom"
      ? top + tileSize - drawHeight
      : top + tileSize / 2 - drawHeight / 2) +
    (layer.offsetY ?? 0) * scale;
  const rect = snapRectToDevicePixels(
    drawX,
    drawY,
    drawX + drawWidth,
    drawY + drawHeight,
    deviceScale,
  );
  // 像素对齐后宽高可能不同，奇数次旋转需要交换包围盒宽高。
  const rotated = Math.abs(layer.rotate ?? 0) % 2 === 1;
  const bounds = rotated
    ? {
        x: rect.x + (rect.width - rect.height) / 2,
        y: rect.y + (rect.height - rect.width) / 2,
        width: rect.height,
        height: rect.width,
      }
    : rect;
  if (!intersectsViewport(bounds, viewport)) return;
  const sourceX = layer.column * sourceTile;
  const sourceY = layer.row * sourceTile;
  const sourceWidth = columns * sourceTile;
  const sourceHeight = rows * sourceTile;
  if (!layer.rotate && !layer.flipX && !layer.flipY) {
    context.drawImage(
      atlas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
    return;
  }
  context.save();
  context.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
  context.rotate((layer.rotate ?? 0) * (Math.PI / 2));
  context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
  context.drawImage(
    atlas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -rect.width / 2,
    -rect.height / 2,
    rect.width,
    rect.height,
  );
  context.restore();
}

function intersectsViewport(rect: PixelRect, viewport?: PixelRect): boolean {
  return !viewport || (
    rect.x < viewport.x + viewport.width &&
    rect.y < viewport.y + viewport.height &&
    rect.x + rect.width > viewport.x &&
    rect.y + rect.height > viewport.y
  );
}

function positiveInteger(value: number | undefined): number | null {
  if (!Number.isFinite(value) || (value ?? 0) < 1) return null;
  return Math.max(1, Math.floor(value!));
}
