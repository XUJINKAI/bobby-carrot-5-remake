import { MapEntityTypeId } from "@bobby/model";
import { createDelayedMoveRuntimeAction } from "../../world/action/builtinActions.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { ICE_MOVEMENT } from "../movement/MovementCadence.js";
import {
  tileCell,
  staticEntity,
} from "./module.js";

const slide: Behavior = {
  id: "ice-slide",
  onEnter({ actor, self, direction, movement, query, commands }) {
    if (!direction || !query.entityHasFact(actor.id, "player")) return;
    const cadenceMs = inheritedCadence(movement);
    commands.startAction(
      createDelayedMoveRuntimeAction(
        actor.id,
        direction,
        nextSlideDelay(movement, cadenceMs),
        {
          mechanism: "ice",
          sourceEntityId: self.entity.id,
          blocksInput: true,
          moveCadenceMs: cadenceMs,
        },
      ),
    );
  },
};

function nextSlideDelay(
  movement: Parameters<NonNullable<Behavior["onEnter"]>>[0]["movement"],
  cadenceMs: number,
): number {
  const motion = movement?.motion;
  const elapsedMotionMs = motion ? motion.durationMs * motion.progress : 0;
  return Math.max(0, cadenceMs - elapsedMotionMs);
}

function inheritedCadence(
  movement: Parameters<NonNullable<Behavior["onEnter"]>>[0]["movement"],
): number {
  const motionDurationMs = movement?.motion?.durationMs;
  if (
    motionDurationMs !== undefined &&
    Number.isFinite(motionDurationMs) &&
    motionDurationMs > 0
  )
    return motionDurationMs;
  const causeCadenceMs =
    movement?.cause.type === "forced" ? movement.cause.cadenceMs : undefined;
  return causeCadenceMs !== undefined &&
    Number.isFinite(causeCadenceMs) &&
    causeCadenceMs > 0
    ? causeCadenceMs
    : ICE_MOVEMENT.normalCellMs;
}

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.ICE,
  presenceFacts: ["walkable"],
  presentation: { name: "Ice" },
};

export const ice: EntityModule = staticEntity(
  definition,
  tileCell(MapEntityTypeId.ICE),
  [{ behavior: slide }],
);
