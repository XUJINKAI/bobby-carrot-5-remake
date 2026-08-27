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
  if (!isPushGoal(type)) return false;
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

/** DOM Palette 使用与 Canvas 相同扩展视觉定义的 CSS 投影。 */
export function customTileIconStyle(
  type: TerrainType | ObjectType,
  size: number,
): Record<string, string> | null {
  if (type === CustomObjectId.PORTAL)
    return {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, transparent 20%, #7c5cff 42%, #54e8ff 58%, transparent 64%)",
    };
  if (isPushGoal(type))
    return {
      width: `${size}px`,
      height: `${size}px`,
      background: "linear-gradient(#6c543d,#6c543d) padding-box",
      border: `${Math.max(2, size * 0.08)}px solid #f2c14e`,
      boxSizing: "border-box",
    };
  return null;
}

function isPushGoal(type: TerrainType | ObjectType): boolean {
  return (
    type === CustomTerrain.PUSH_GOAL || type === CustomTerrain.PUSH_GOAL_START
  );
}
