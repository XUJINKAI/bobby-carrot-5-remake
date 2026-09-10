import type { VisualComposition } from "./VisualDefinition.js";

/** 未注册 Entity 保留空间位置，但不获得任何 gameplay 能力。 */
export function unknownEntityVisual(): VisualComposition {
  return {
    layers: [{ kind: "canvas", draw: drawUnknownEntity }],
  };
}

function drawUnknownEntity(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  const inset = Math.max(2, size * 0.12);
  context.save();
  context.fillStyle = "rgba(28, 8, 18, 0.82)";
  context.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
  context.strokeStyle = "#ff4f81";
  context.lineWidth = Math.max(2, size * 0.09);
  context.strokeRect(
    x + inset,
    y + inset,
    size - inset * 2,
    size - inset * 2,
  );
  context.beginPath();
  context.moveTo(x + inset * 1.6, y + inset * 1.6);
  context.lineTo(x + size - inset * 1.6, y + size - inset * 1.6);
  context.moveTo(x + size - inset * 1.6, y + inset * 1.6);
  context.lineTo(x + inset * 1.6, y + size - inset * 1.6);
  context.stroke();
  context.restore();
}
