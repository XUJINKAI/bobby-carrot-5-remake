import { EntityTypeId } from "@bobby/model";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";
import type { Behavior } from "../../world/behavior/Behavior.js";

const portalBehavior: Behavior = {
  id: "portal",
  onEnter({ query, actor, self, commands }) {
    const channel = self.entity.properties?.channel;
    const target = query.entitiesWithTrait("portal").find(
      (entity) =>
        entity.id !== self.entity.id && entity.properties?.channel === channel,
    );
    if (!target) return;
    commands.move(actor.id, target.anchor.x, target.anchor.y);
    commands.emit({
      type: "teleport",
      entityId: self.entity.id,
      x: target.anchor.x,
      y: target.anchor.y,
    });
  },
};

export const portal: EntityModule = defineEntityModule({
  definition: {
    type: EntityTypeId.PORTAL,
    traits: ["portal"],
    stackBand: "content",
    properties: [
      {
        key: "channel",
        kind: "enum",
        label: "频道",
        default: "blue",
        options: [
          { value: "blue", label: "蓝色" },
          { value: "red", label: "红色" },
          { value: "green", label: "绿色" },
        ],
      },
    ],
    presentation: { name: "Portal", category: "机关" },
    authoring: { palette: true, category: "机关" },
  },
  behaviorBindings: [{ trait: "portal", behavior: portalBehavior }],
  visual: {
    id: EntityTypeId.PORTAL,
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
  },
});

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
