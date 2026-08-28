import { EntityTypeId } from "@bobby/model";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";

export const pushGoal: EntityModule = defineEntityModule({
  definition: {
    type: EntityTypeId.PUSH_GOAL,
    traits: ["walkable", "push-goal"],
    stackOrder: 0,
    occupancy: { group: "surface", replaceSameGroup: true },
    presentation: { name: "Push Goal", category: "目标" },
    authoring: { palette: true, category: "目标" },
  },
  visual: {
    id: EntityTypeId.PUSH_GOAL,
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
  },
});

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
