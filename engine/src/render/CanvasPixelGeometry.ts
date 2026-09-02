export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function resolveDevicePixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return Math.max(1, window.devicePixelRatio || 1);
}

export function snapToDevicePixel(value: number, deviceScale: number): number {
  return Math.round(value * deviceScale) / deviceScale;
}

export function snapRectToDevicePixels(
  left: number,
  top: number,
  right: number,
  bottom: number,
  deviceScale: number,
): PixelRect {
  const snappedLeft = snapToDevicePixel(left, deviceScale);
  const snappedTop = snapToDevicePixel(top, deviceScale);
  const snappedRight = snapToDevicePixel(right, deviceScale);
  const snappedBottom = snapToDevicePixel(bottom, deviceScale);
  return {
    x: snappedLeft,
    y: snappedTop,
    width: snappedRight - snappedLeft,
    height: snappedBottom - snappedTop,
  };
}

export function prepareCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  cssWidth: number,
  cssHeight: number,
  deviceScale = resolveDevicePixelRatio(),
): number {
  const pixelWidth = Math.round(cssWidth * deviceScale);
  const pixelHeight = Math.round(cssHeight * deviceScale);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  context.imageSmoothingEnabled = false;
  return deviceScale;
}
