import {
  MapEntityTypeId,
  normalizeColorHex,
  type JsonValue,
} from "@bobby/model";
import { createDelayedMoveRuntimeAction } from "../../world/action/builtinActions.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";

const portalBehavior: Behavior = {
  id: "portal",
  onEnter({ query, actor, self, direction, movement, commands }) {
    if (!direction) return;
    const channel = self.entity.state?.channel;
    const target = query.entitiesWithTrait("portal").find(
      (entity) =>
        entity.id !== self.entity.id && entity.state?.channel === channel,
    );
    if (!target) return;
    const targetHasPlayer = query.presencesAt(target.anchor).some(
      (presence) =>
        presence.entityId !== actor.id && presence.traits.includes("player"),
    );
    if (targetHasPlayer) return;
    commands.relocate(actor.id, target.anchor.x, target.anchor.y);
    commands.startAction(
      createDelayedMoveRuntimeAction(actor.id, direction, 0, {
        mechanism: "portal",
        sourceEntityId: target.id,
        blocksInput: true,
        moveCadenceMs: movement?.motion?.durationMs ?? 0,
      }),
    );
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
    type: MapEntityTypeId.PORTAL,
    traits: ["portal"],
    stackOrder: 100,
    properties: [
      {
        key: "channel",
        kind: "string",
        label: "频道",
        default: "blue",
      },
      {
        key: "color",
        kind: "string",
        label: "颜色",
        default: "#54e8ff",
      },
    ],
    presentation: { name: "Portal" },
  },
  behaviorBindings: [{ trait: "portal", behavior: portalBehavior }],
  visual: {
    id: MapEntityTypeId.PORTAL,
    resolve: ({ entity, time }) => ({
      layers: [{
        kind: "canvas",
        draw: (context, x, y, size) =>
          drawPortal(
            context,
            x,
            y,
            size,
            portalColor(entity.state?.color),
            portalFrame(time?.nowMs),
          ),
      }],
    }),
  },
});

interface PortalColors {
  core: string;
  ring: string;
  edge: string;
  glow: string;
}

function portalColor(color: JsonValue | undefined): string {
  return typeof color === "string"
    ? normalizeColorHex(color) ?? "#54e8ff"
    : "#54e8ff";
}

function portalColors(color: string): PortalColors {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const pale = mixWithWhite(red, green, blue, 0.5);
  return {
    core: `rgba(${red},${green},${blue},.12)`,
    ring: color,
    edge: pale,
    glow: `rgba(${red},${green},${blue},0)`,
  };
}

function mixWithWhite(
  red: number,
  green: number,
  blue: number,
  ratio: number,
): string {
  const mix = (value: number) => Math.round(value + (255 - value) * ratio);
  return `rgb(${mix(red)},${mix(green)},${mix(blue)})`;
}

function portalFrame(nowMs: number | undefined): 0 | 1 | 2 {
  return (Math.floor(Math.max(0, nowMs ?? 0) / 160) % 3) as 0 | 1 | 2;
}

function drawPortal(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  frame: 0 | 1 | 2,
): void {
  const colors = portalColors(color);
  const pulse = [0, 0.018, -0.012][frame]!;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    size * 0.08,
    centerX,
    centerY,
    size * (0.42 + pulse),
  );
  gradient.addColorStop(0, colors.core);
  gradient.addColorStop(0.55, colors.ring);
  gradient.addColorStop(0.78, colors.edge);
  gradient.addColorStop(1, colors.glow);
  context.save();
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(centerX, centerY, size * (0.44 + pulse), 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(225,252,255,.9)";
  context.lineWidth = Math.max(1, size * 0.035);
  context.beginPath();
  context.arc(centerX, centerY, size * 0.29, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = colors.edge;
  context.lineWidth = Math.max(1, size * 0.025);
  context.beginPath();
  const start = frame * Math.PI * 2 / 3;
  context.arc(centerX, centerY, size * 0.36, start, start + Math.PI * 0.8);
  context.stroke();
  context.restore();
}
