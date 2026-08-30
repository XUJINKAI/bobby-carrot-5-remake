import type {
  AtlasVisualLayer,
  ImageManager,
  ImageVisualLayer,
  VisualComposition,
} from "@bobby/engine";

export function drawEditorVisualComposition(
  context: CanvasRenderingContext2D,
  images: ImageManager,
  composition: VisualComposition | null,
  left: number,
  top: number,
  tileSize: number,
): void {
  if (!composition) return;
  for (const layer of composition.layers) {
    if (layer.kind === "canvas") layer.draw(context, left, top, tileSize);
    else if (layer.kind === "image")
      drawImageLayer(context, images, layer, left, top, tileSize);
    else drawAtlasLayer(context, images, layer, left, top, tileSize);
  }
}

function drawImageLayer(
  context: CanvasRenderingContext2D,
  images: ImageManager,
  layer: ImageVisualLayer,
  left: number,
  top: number,
  tileSize: number,
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
  const rows = requestedRows ?? Math.max(1, Math.floor(image.height / frameHeight));
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
      left,
      top,
      tileSize,
      tileSize,
    );
    return;
  }
  const scale = tileSize / images.sourceTileSize;
  const drawWidth = frameWidth * scale;
  const drawHeight = frameHeight * scale;
  const drawX =
    left + tileSize / 2 - drawWidth / 2 + (layer.offsetX ?? 0) * scale;
  const drawY =
    (layer.anchor === "center"
      ? top + tileSize / 2 - drawHeight / 2
      : top + tileSize - drawHeight) +
    (layer.offsetY ?? 0) * scale;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    frameWidth,
    frameHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  );
}

function drawAtlasLayer(
  context: CanvasRenderingContext2D,
  images: ImageManager,
  layer: AtlasVisualLayer,
  left: number,
  top: number,
  tileSize: number,
): void {
  const atlas = images.image(images.atlasId);
  if (!atlas) return;
  const sourceTile = images.sourceTileSize;
  const centerX = left + tileSize / 2;
  const centerY = top + tileSize / 2;
  context.save();
  context.translate(centerX, centerY);
  context.rotate((layer.rotate ?? 0) * (Math.PI / 2));
  context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
  context.drawImage(
    atlas,
    layer.column * sourceTile,
    layer.row * sourceTile,
    sourceTile,
    sourceTile,
    -tileSize / 2,
    -tileSize / 2,
    tileSize,
    tileSize,
  );
  context.restore();
}

function positiveInteger(value: number | undefined): number | null {
  if (!Number.isFinite(value) || (value ?? 0) < 1) return null;
  return Math.max(1, Math.floor(value!));
}
