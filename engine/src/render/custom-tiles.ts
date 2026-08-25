import type { ObjectType, TerrainType } from "../data/types.js";
import { CustomObjectId, CustomTerrain } from "../mechanics/ids.js";

/** Engine 与 Editor 共用的扩展素材绘制入口。 */
export function drawCustomTerrain(
  context: CanvasRenderingContext2D,
  type: TerrainType,
  x: number,
  y: number,
  size: number,
): boolean {
  if (type !== CustomTerrain.PUSH_GOAL) return false;
  context.save();
  context.fillStyle = "#6c543d";
  context.fillRect(x, y, size, size);
  context.strokeStyle = "#f2c14e";
  context.lineWidth = Math.max(2, size * 0.08);
  context.strokeRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
  context.restore();
  return true;
}

export function drawCustomObject(
  context: CanvasRenderingContext2D,
  type: ObjectType,
  x: number,
  y: number,
  size: number,
): boolean {
  if (type !== CustomObjectId.PORTAL) return false;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    size * 0.08,
    centerX,
    centerY,
    size * 0.42,
  );
  gradient.addColorStop(0, "rgba(130,238,255,.12)");
  gradient.addColorStop(0.55, "#7c5cff");
  gradient.addColorStop(0.78, "#54e8ff");
  gradient.addColorStop(1, "rgba(84,232,255,0)");
  context.save();
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(centerX, centerY, size * 0.44, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(225,252,255,.9)";
  context.lineWidth = Math.max(1, size * 0.035);
  context.beginPath();
  context.arc(centerX, centerY, size * 0.29, 0, Math.PI * 2);
  context.stroke();
  context.restore();
  return true;
}
