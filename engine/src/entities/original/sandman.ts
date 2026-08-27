import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  atlasVisual,
  contentDefinition,
  objectCell,
  originalModule,
} from "./module.js";

const definition = contentDefinition(
  EntityTypeId.SANDMAN,
  "Sandman",
  ["blocking"],
  {
    occupancy: { group: "actor" },
    footprint: {
      rotateWithDirection: true,
      baseDirection: "down",
      parts: [
        { dx: 0, dy: 0, role: "head" },
        { dx: 0, dy: 1, role: "body" },
      ],
    },
    presentation: { name: "Sandman", category: "角色" },
    authoring: {
      palette: true,
      category: "角色",
      defaultDirection: "down",
    },
  },
);

export const sandman: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body" ? objectCell(33) : objectCell(17),
  ),
);
