import { EntityTypeId } from "@bobby/model";
import type { VisualDefinition } from "../../visual/VisualDefinition.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.DRAGON,
  traits: ["dragon"],
  stackOrder: CONTENT_STACK_ORDER,
  footprint: {
    rotateWithDirection: true,
    baseDirection: "left",
    parts: [
      {
        dx: 0,
        dy: 0,
        role: "head",
        traits: ["blocking", "dragon-fire-blocking"],
      },
      {
        dx: 1,
        dy: 0,
        role: "body",
        traits: ["blocking", "dragon-fire-blocking"],
      },
      {
        dx: 2,
        dy: 0,
        role: "tail",
        traits: ["walkable", "dragon-trigger"],
      },
    ],
  },
  presentation: { name: "Dragon" },
};

const visual: VisualDefinition = {
  id: EntityTypeId.DRAGON,
  resolve(context) {
    const atlas =
      context.presence.role === "body"
        ? objectCell(15)
        : context.presence.role === "tail"
          ? objectCell(16)
          : objectCell(14);
    return {
      layers: [
        {
          kind: "atlas",
          column: atlas.column,
          row: atlas.row,
          ...(context.entity.direction === "right" ? { flipX: true } : {}),
        },
      ],
    };
  },
};

const dragonBehavior: Behavior = {
  id: "dragon-placeholder",
};

export const dragon: EntityModule = originalModule(
  definition,
  visual,
  [{ trait: "dragon", behavior: dragonBehavior }],
);
