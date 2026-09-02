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
      );
    } else {
      drawAtlasLayer(context, images, layer, cell);
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
  const sourceX = (frame % columns) * frameWidth;
  const sourceY = Math.floor(frame / columns) * frameHeight;

  if (layer.anchor === "fill") {
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

  const scale = tileSize / images.sourceTileSize;
  const drawWidth = frameWidth * scale;
  const drawHeight = frameHeight * scale;
  const drawX =
    cell.x + cell.width / 2 - drawWidth / 2 + (layer.offsetX ?? 0) * scale;
  const drawY =
    (layer.anchor === "center"
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
  cell: PixelRect,
): void {
  const atlas = images.image(images.atlasId);
  if (!atlas) return;
  const sourceTile = images.sourceTileSize;
  context.save();
  context.translate(cell.x + cell.width / 2, cell.y + cell.height / 2);
  context.rotate((layer.rotate ?? 0) * (Math.PI / 2));
  context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
  context.drawImage(
    atlas,
    layer.column * sourceTile,
    layer.row * sourceTile,
    sourceTile,
    sourceTile,
    -cell.width / 2,
    -cell.height / 2,
    cell.width,
    cell.height,
  );
  context.restore();
}

function positiveInteger(value: number | undefined): number | null {
  if (!Number.isFinite(value) || (value ?? 0) < 1) return null;
  return Math.max(1, Math.floor(value!));
}
