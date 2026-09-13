import type { ImageManager } from "../image/ImageManager.js";
import type { WorldCalloutRenderItem } from "../visual/callout/WorldCallout.js";
import type { Camera } from "./Camera.js";
import {
  snapRectToDevicePixels,
  type PixelRect,
} from "./CanvasPixelGeometry.js";

const CALLOUT_GAP_SOURCE_PX = 1;
const TEXT_FONT_SOURCE_PX = 14;
const TEXT_LINE_HEIGHT_SOURCE_PX = 18;
const TEXT_PADDING_X_SOURCE_PX = 6;
const TEXT_PADDING_Y_SOURCE_PX = 4;

interface CalloutSize {
  width: number;
  height: number;
}

/** Callout 使用 Camera 定位，并以 source-pixel 尺寸随地图缩放。 */
export function drawWorldCallout(
  context: CanvasRenderingContext2D,
  images: ImageManager,
  item: WorldCalloutRenderItem,
  camera: Camera,
  viewport: PixelRect,
  deviceScale = 1,
): void {
  const anchor = camera.worldToScreen(item.x, item.y);
  if (!pointInsideViewport(anchor, viewport)) return;

  const scale = camera.tileScreenSize / images.sourceTileSize;
  const size = measureCallout(context, images, item, scale);
  if (!size || size.width <= 0 || size.height <= 0) return;

  const clearance = Math.max(0, item.clearanceSourcePx) * scale;
  const gap = CALLOUT_GAP_SOURCE_PX * scale;
  const aboveTop = anchor.y - clearance - gap - size.height;
  const useBelow =
    item.placement === "below" ||
    (item.placement === "auto-vertical" && aboveTop < viewport.y);
  const left = anchor.x - size.width / 2;
  const top = useBelow ? anchor.y + clearance + gap : aboveTop;
  const rect = snapRectToDevicePixels(
    left,
    top,
    left + size.width,
    top + size.height,
    deviceScale,
  );
  if (!intersectsViewport(rect, viewport)) return;

  if (item.content.type === "image-slice") {
    const slice = images.slice(item.content.sliceId);
    if (!slice) return;
    context.drawImage(
      slice.image,
      slice.x,
      slice.y,
      slice.width,
      slice.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
    return;
  }

  drawTextCallout(context, item.content.text, rect, scale);
}

function measureCallout(
  context: CanvasRenderingContext2D,
  images: ImageManager,
  item: WorldCalloutRenderItem,
  scale: number,
): CalloutSize | null {
  if (item.content.type === "image-slice") {
    const definition = images.sliceDefinition(item.content.sliceId);
    return {
      width: definition.width * scale,
      height: definition.height * scale,
    };
  }

  const lines = textLines(item.content.text);
  context.save();
  context.font = `${TEXT_FONT_SOURCE_PX * scale}px system-ui, sans-serif`;
  const textWidth = Math.max(
    0,
    ...lines.map((line) => context.measureText(line).width),
  );
  context.restore();
  return {
    width: textWidth + TEXT_PADDING_X_SOURCE_PX * 2 * scale,
    height:
      lines.length * TEXT_LINE_HEIGHT_SOURCE_PX * scale +
      TEXT_PADDING_Y_SOURCE_PX * 2 * scale,
  };
}

function drawTextCallout(
  context: CanvasRenderingContext2D,
  text: string,
  rect: PixelRect,
  scale: number,
): void {
  const lines = textLines(text);
  context.save();
  context.fillStyle = "rgba(8, 14, 22, 0.82)";
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.fillStyle = "#f7fbff";
  context.font = `${TEXT_FONT_SOURCE_PX * scale}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const firstLineY =
    rect.y +
    TEXT_PADDING_Y_SOURCE_PX * scale +
    TEXT_LINE_HEIGHT_SOURCE_PX * scale / 2;
  for (const [index, line] of lines.entries()) {
    context.fillText(
      line,
      rect.x + rect.width / 2,
      firstLineY + index * TEXT_LINE_HEIGHT_SOURCE_PX * scale,
    );
  }
  context.restore();
}

function textLines(text: string): string[] {
  const lines = text.split("\n");
  return lines.length > 0 ? lines : [""];
}

function pointInsideViewport(
  point: { x: number; y: number },
  viewport: PixelRect,
): boolean {
  return (
    point.x >= viewport.x &&
    point.x <= viewport.x + viewport.width &&
    point.y >= viewport.y &&
    point.y <= viewport.y + viewport.height
  );
}

function intersectsViewport(rect: PixelRect, viewport: PixelRect): boolean {
  return (
    rect.x < viewport.x + viewport.width &&
    rect.y < viewport.y + viewport.height &&
    rect.x + rect.width > viewport.x &&
    rect.y + rect.height > viewport.y
  );
}
