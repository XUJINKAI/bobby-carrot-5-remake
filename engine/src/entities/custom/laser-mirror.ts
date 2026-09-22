import {
  MapEntityTypeId,
  type Direction,
  type JsonValue,
} from "@bobby/model";
import { ROBO2_GAMEPLAY_IMAGE_IDS } from "../../image/Robo2GameplayImages.js";
import type { EntityInstance } from "../../world/entity/EntityInstance.js";
import {
  defineEntityModule,
  type EntityModule,
  type EntityModuleDefinition,
} from "../EntityModule.js";

export type LaserMirrorVariant = "slash" | "backslash";

const variants: readonly LaserMirrorVariant[] = ["slash", "backslash"];
const reflections: Readonly<
  Record<LaserMirrorVariant, Readonly<Record<Direction, Direction>>>
> = {
  slash: {
    up: "right",
    right: "up",
    down: "left",
    left: "down",
  },
  backslash: {
    up: "left",
    left: "up",
    down: "right",
    right: "down",
  },
};

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.LASER_MIRROR,
  presenceFacts: ["blocking", "pushable"],
  properties: [
    {
      key: "variant",
      kind: "enum",
      label: "方向",
      default: "slash",
      options: variants.map((value) => ({ value })),
    },
  ],
  presentation: { name: "Laser Mirror" },
};

export const laserMirror: EntityModule = defineEntityModule({
  definition,
  visual: {
    id: definition.type,
    resolve(context) {
      const variant = laserMirrorVariant(context.entity.state?.variant);
      return {
        layers: [{
          kind: "image",
          renderPass: "standing",
          asset: ROBO2_GAMEPLAY_IMAGE_IDS.mirror[variant],
          sourceTileSize: 12,
          anchor: "top-left",
        }],
      };
    },
  },
});

export function reflectedLaserDirection(
  entity: Readonly<EntityInstance>,
  incoming: Direction,
): Direction | null {
  if (entity.type !== MapEntityTypeId.LASER_MIRROR) return null;
  const variant = laserMirrorVariant(entity.state?.variant);
  return reflections[variant][incoming];
}

/** 原版镜面只有朝向反光面的一侧会覆绘入射光。 */
export function laserMirrorCoversIncoming(
  entity: Readonly<EntityInstance>,
  incoming: Direction,
): boolean {
  if (entity.type !== MapEntityTypeId.LASER_MIRROR) return false;
  const variant = laserMirrorVariant(entity.state?.variant);
  return incoming === "down" ||
    (variant === "slash" ? incoming === "right" : incoming === "left");
}

function laserMirrorVariant(value: JsonValue | undefined): LaserMirrorVariant {
  return value === "backslash" ? "backslash" : "slash";
}
