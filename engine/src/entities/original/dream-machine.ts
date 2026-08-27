import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  atlasVisual,
  contentDefinition,
  objectCell,
  originalModule,
} from "./module.js";

const definition = contentDefinition(
  EntityTypeId.DREAM_MACHINE,
  "Dream Machine",
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
    presentation: { name: "Dream Machine", category: "角色" },
    authoring: {
      palette: true,
      category: "角色",
      defaultDirection: "down",
    },
  },
);

export const dreamMachine: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body" ? objectCell(34) : objectCell(18),
  ),
);
