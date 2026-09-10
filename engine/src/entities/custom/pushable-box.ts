import { MapEntityTypeId } from "@bobby/model";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";

export const pushableBox: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.PUSHABLE_BOX,
    traits: ["blocking", "pushable"],
    stackOrder: 100,
    presentation: { name: "Pushable Box" },
  },
  visual: {
    id: MapEntityTypeId.PUSHABLE_BOX,
    resolve: () => ({
      layers: [{ kind: "canvas", draw: drawPushableBox }],
    }),
  },
});

function drawPushableBox(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  const inset = size * 0.09;
  const left = x + inset;
  const top = y + inset;
  const width = size - inset * 2;
  const braceInset = size * 0.22;
  context.save();
  context.fillStyle = "rgba(16,8,2,.35)";
  context.fillRect(left + size * 0.04, top + size * 0.06, width, width);
  context.fillStyle = "#a85e26";
  context.fillRect(left, top, width, width);
  context.strokeStyle = "#542a12";
  context.lineWidth = Math.max(1, size * 0.055);
  context.lineJoin = "round";
  context.strokeRect(left, top, width, width);
  context.fillStyle = "#d28a3d";
  context.fillRect(
    left + size * 0.07,
    top + size * 0.07,
    width - size * 0.14,
    width - size * 0.14,
  );
  context.strokeStyle = "#713916";
  context.lineWidth = Math.max(2, size * 0.105);
  context.beginPath();
  context.moveTo(x + braceInset, y + braceInset);
  context.lineTo(x + size - braceInset, y + size - braceInset);
  context.moveTo(x + size - braceInset, y + braceInset);
  context.lineTo(x + braceInset, y + size - braceInset);
  context.stroke();
  context.strokeStyle = "#e9ad59";
  context.lineWidth = Math.max(1, size * 0.026);
  context.strokeRect(
    left + size * 0.035,
    top + size * 0.035,
    width - size * 0.07,
    width - size * 0.07,
  );
  context.fillStyle = "#f4cf82";
  const boltSize = Math.max(1.5, size * 0.055);
  const bolts: readonly (readonly [number, number])[] = [
    [left + size * 0.08, top + size * 0.08],
    [left + width - size * 0.08, top + size * 0.08],
    [left + size * 0.08, top + width - size * 0.08],
    [left + width - size * 0.08, top + width - size * 0.08],
  ];
  for (const [boltX, boltY] of bolts) {
    context.beginPath();
    context.arc(boltX, boltY, boltSize, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
