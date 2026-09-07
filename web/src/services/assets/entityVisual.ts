import {
  resolveLevelEntityVisualPreview,
  type LevelEntityVisualPreviewSource,
  type ImageManager,
} from "@bobby/engine";

export function entityVisualStyle(
  images: ImageManager,
  entity: LevelEntityVisualPreviewSource,
  size: number,
): Record<string, string> | null {
  const layer = resolveLevelEntityVisualPreview(entity)?.layers[0];
  if (!layer) return null;
  if (layer.kind === "atlas") {
    const url = images.source(images.atlasId);
    if (!url) return null;
    const transforms = [];
    if (layer.rotate) transforms.push(`rotate(${layer.rotate * 90}deg)`);
    if (layer.flipX) transforms.push("scaleX(-1)");
    if (layer.flipY) transforms.push("scaleY(-1)");
    return {
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url('${url}')`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${16 * size}px auto`,
      backgroundPosition: `${-layer.column * size}px ${-layer.row * size}px`,
      ...(transforms.length ? { transform: transforms.join(" ") } : {}),
    };
  }
  if (layer.kind === "image") {
    const url = images.source(layer.asset);
    if (!url) return null;
    const columns = positiveInteger(layer.frameColumns) ?? 1;
    const rows = positiveInteger(layer.frameRows) ?? 1;
    const frameCount = columns * rows;
    const progress = Math.max(
      0,
      Math.min(0.999999, layer.frameProgress ?? 0),
    );
    const requestedFrame =
      layer.frameIndex ?? Math.floor(progress * frameCount);
    const frame = Math.max(0, Math.min(frameCount - 1, requestedFrame));
    const column = frame % columns;
    const row = Math.floor(frame / columns);
    const image = images.image(layer.asset);
    if (!image) {
      return {
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url('${url}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${columns * size}px ${rows * size}px`,
        backgroundPosition: `${-column * size}px ${-row * size}px`,
      };
    }
    const frameWidth = image.width / columns;
    const frameHeight = image.height / rows;
    const scale = Math.min(size / frameWidth, size / frameHeight);
    const drawWidth = frameWidth * scale;
    const drawHeight = frameHeight * scale;
    const backgroundWidth = image.width * scale;
    const backgroundHeight = image.height * scale;
    const left = (size - drawWidth) / 2 - column * drawWidth;
    const top = (size - drawHeight) / 2 - row * drawHeight;
    return {
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url('${url}')`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${backgroundWidth}px ${backgroundHeight}px`,
      backgroundPosition: `${left}px ${top}px`,
    };
  }
  return null;
}

export function styleRecordToText(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([key, value]) => `${toCssProperty(key)}:${value}`)
    .join(";");
}

function positiveInteger(value: number | undefined): number | null {
  if (!Number.isFinite(value) || (value ?? 0) < 1) return null;
  return Math.max(1, Math.floor(value!));
}

function toCssProperty(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
