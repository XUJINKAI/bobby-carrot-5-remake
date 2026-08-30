import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  activeState,
  atlasVisual,
  cell,
  originalModule,
  SURFACE_STACK_ORDER,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.TRAP,
  traits: ["walkable", "hazard"],
  stackOrder: SURFACE_STACK_ORDER,
  state: activeState(true),
  presentation: { name: "Trap" },
};

export const trap: EntityModule = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    context.entity.state?.active === false ? cell(0, 11) : cell(15, 10),
  ),
);
