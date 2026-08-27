import {
  EntityTypeId,
  resolveEntityVisualPreview,
  type EntityVisualPreviewSource,
} from "@bobby/engine";
import { siteUrl } from "./gameAssets.js";

export function entityVisualStyle(
  entity: EntityVisualPreviewSource,
  size: number,
): Record<string, string> | null {
  if (entity.type === EntityTypeId.BOBBY) {
    return {
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url('${siteUrl("assets/art/hd/b3.png")}')`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "left bottom",
      backgroundSize: "auto 100%",
    };
  }

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
  if (layer.id === EntityTypeId.PUSH_GOAL) {
    return {
      width: `${size}px`,
      height: `${size}px`,
      background: "#6c543d",
      boxShadow: `inset 0 0 0 ${Math.max(2, Math.round(size * 0.08))}px #f2c14e`,
    };
  }
  if (layer.id === EntityTypeId.PORTAL) {
    return {
      width: `${size}px`,
      height: `${size}px`,
      background:
        "radial-gradient(circle, rgba(130,238,255,.18) 10%, #7c5cff 48%, #54e8ff 68%, rgba(84,232,255,0) 72%)",
      borderRadius: "50%",
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
