import { MapEntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  tileCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.DREAM_MACHINE,
  facts: [],
  mechanisms: ["object-interaction", "dialog"],
  footprint: {
    parts: [
      { dx: 0, dy: -1, role: "head" },
      { dx: 0, dy: 0, role: "body", facts: ["blocking"] },
    ],
  },
  presentation: { name: "Dream Machine", renderPass: "standing" },
};

export const dreamMachine: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body"
      ? tileCell(MapEntityTypeId.DREAM_MACHINE, { role: "body" })
      : tileCell(MapEntityTypeId.DREAM_MACHINE, { role: "head" }),
  ),
);
