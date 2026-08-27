import {
  resolveEntityVisualPreview,
  type EntityVisualPreviewSource,
} from "@bobby/engine";
import { gameAssets, siteUrl } from "./gameAssets.js";

export function entityVisualStyle(
  entity: EntityVisualPreviewSource,
  size: number,
): Record<string, string> | null {
  const layer = resolveEntityVisualPreview(entity)?.layers[0];
  if (!layer) return null;
  if (layer.kind === "atlas") {
    const transforms = [];
    if (layer.rotate) transforms.push(`rotate(${layer.rotate * 90}deg)`);
    if (layer.flipX) transforms.push("scaleX(-1)");
    if (layer.flipY) transforms.push("scaleY(-1)");
    return {
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url('${siteUrl("assets/art/hd/ts.png")}')`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${16 * size}px auto`,
      backgroundPosition: `${-layer.column * size}px ${-layer.row * size}px`,
      ...(transforms.length ? { transform: transforms.join(" ") } : {}),
    };
  }
  if (layer.kind === "image") {
    const url = gameAssets().imageUrls?.[layer.asset];
    if (!url) return null;
    return {
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url('${url}')`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "left bottom",
      backgroundSize: "auto 100%",
    };
  }
  if (layer.previewStyle) {
    return {
      width: `${size}px`,
      height: `${size}px`,
      ...layer.previewStyle,
    };
  }
  return null;
}

export function styleRecordToText(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([key, value]) => `${toCssProperty(key)}:${value}`)
    .join(";");
}

function toCssProperty(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
