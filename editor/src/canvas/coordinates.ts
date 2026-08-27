import type { Cell } from "../authoring/entityPlacement.js";

export function canvasPointToCell(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  clientX: number,
  clientY: number,
): Cell | null {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((clientX - rect.left) / rect.width) * width);
  const y = Math.floor(((clientY - rect.top) / rect.height) * height);
  return x >= 0 && y >= 0 && x < width && y < height ? { x, y } : null;
}
