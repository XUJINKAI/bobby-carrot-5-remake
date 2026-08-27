import { EntityTypeId } from "@bobby/model";
import type { EntityDefinition } from "../../world/entity/EntityDefinition.js";
import type { VisualDefinition } from "../../visual/VisualDefinition.js";

export function customVisualDefinition(
  definition: EntityDefinition,
): VisualDefinition {
  const id = definition.presentation.visual ?? definition.type;
  if (definition.type === EntityTypeId.PUSH_GOAL) {
    return {
      id,
      resolve: () => ({
        layers: [
          {
            kind: "canvas",
            draw: drawPushGoal,
            previewStyle: {
              background: "#6c543d",
              boxShadow: "inset 0 0 0 3px #f2c14e",
            },
          },
        ],
      }),
    };
  }
  if (definition.type === EntityTypeId.PORTAL) {
    return {
      id,
      resolve: () => ({
        layers: [
          {
            kind: "canvas",
            draw: drawPortal,
            previewStyle: {
              background:
                "radial-gradient(circle, rgba(130,238,255,.18) 10%, #7c5cff 48%, #54e8ff 68%, rgba(84,232,255,0) 72%)",
              borderRadius: "50%",
            },
          },
        ],
      }),
    };
  }
  return { id, resolve: () => null };
}

function drawPushGoal(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  context.save();
  context.fillStyle = "#6c543d";
  context.fillRect(x, y, size, size);
  context.strokeStyle = "#f2c14e";
  context.lineWidth = Math.max(2, size * 0.08);
  context.strokeRect(
    x + size * 0.2,
    y + size * 0.2,
    size * 0.6,
    size * 0.6,
  );
  context.restore();
}

function drawPortal(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
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
}
