import {
  MapEntityTypeId,
  type Direction,
  type JsonValue,
} from "@bobby/model";
import type { EntityInstance } from "../../world/entity/EntityInstance.js";
import {
  defineEntityModule,
  type EntityModule,
  type EntityModuleDefinition,
} from "../EntityModule.js";
import { atlasVisual, tileCell } from "../original/module.js";

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
  visual: atlasVisual(
    definition,
    (context) =>
      tileCell(MapEntityTypeId.MIRROR, {
        fields: {
          variant: laserMirrorVariant(context.entity.state?.variant) === "slash"
            ? "left-top"
            : "right-top",
        },
      }),
  ),
});

export function reflectedLaserDirection(
  entity: Readonly<EntityInstance>,
  incoming: Direction,
): Direction | null {
  if (entity.type !== MapEntityTypeId.LASER_MIRROR) return null;
  const variant = laserMirrorVariant(entity.state?.variant);
  return reflections[variant][incoming];
}

function laserMirrorVariant(value: JsonValue | undefined): LaserMirrorVariant {
  return value === "backslash" ? "backslash" : "slash";
}
