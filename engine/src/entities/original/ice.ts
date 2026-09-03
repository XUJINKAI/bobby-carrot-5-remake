import { EntityTypeId } from "@bobby/model";
import { createDelayedMoveRuntimeAction } from "../../world/action/builtinActions.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  cell,
  staticEntity,
  SURFACE_STACK_ORDER,
} from "./module.js";

/**
 * Ice owns its automatic-step cadence. It currently matches the tuned original
 * Bobby cadence, but remains independent so later source comparison can tune it
 * without changing Bobby or WorldClock.
 */
export const DEFAULT_ICE_SLIDE_CADENCE_MS = 350;

const slide: Behavior = {
  id: "ice-slide",
  onEnter({ actor, self, direction, query, commands }) {
    if (!direction || !query.entityHasTrait(actor.id, "player")) return;
    commands.startAction(
      createDelayedMoveRuntimeAction(
        actor.id,
        direction,
        DEFAULT_ICE_SLIDE_CADENCE_MS,
        {
          mechanism: "ice",
          sourceEntityId: self.entity.id,
          blocksInput: true,
        },
      ),
    );
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.ICE,
  traits: ["walkable", "forced-movement"],
  layer: "surface",
  stackOrder: SURFACE_STACK_ORDER,
  presentation: { name: "Ice" },
};

export const ice: EntityModule = staticEntity(
  definition,
  cell(4, 9),
  [{ behavior: slide }],
);
