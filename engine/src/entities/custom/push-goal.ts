import { MapEntityTypeId } from "@bobby/model";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";

export const pushGoal: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.PUSH_GOAL,
    traits: ["walkable", "push-goal"],
    stackOrder: 0,
    presentation: { name: "Push Goal" },
  },
  visual: {
    id: MapEntityTypeId.PUSH_GOAL,
    resolve: () => ({
      layers: [{ kind: "canvas", draw: drawPushGoal }],
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
