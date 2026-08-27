import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  atlasVisual,
  contentDefinition,
  objectCell,
  originalModule,
} from "./module.js";

const definition = contentDefinition(EntityTypeId.DRAGON, "Dragon", ["dragon"], {
  occupancy: { group: "actor" },
  footprint: {
    rotateWithDirection: true,
    baseDirection: "right",
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
  presentation: { name: "Dragon", category: "角色" },
  authoring: {
    palette: true,
    category: "角色",
    cursor: { dx: 1, dy: 0 },
    defaultDirection: "right",
  },
});

export const dragon: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) => {
    if (context.presence.role === "body") return objectCell(15);
    if (context.presence.role === "tail") return objectCell(16);
    return objectCell(14);
  }),
);
