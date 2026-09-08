import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  tileCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.DREAM_MACHINE,
  traits: ["blocking"],
  stackOrder: CONTENT_STACK_ORDER,
  footprint: {
    parts: [
      { dx: 0, dy: 0, role: "head" },
      { dx: 0, dy: 1, role: "body" },
    ],
  },
  presentation: { name: "Dream Machine" },
};

export const dreamMachine: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.presence.role === "body"
      ? tileCell(EntityTypeId.DREAM_MACHINE, { role: "body" })
      : tileCell(EntityTypeId.DREAM_MACHINE, { role: "head" }),
  ),
);
