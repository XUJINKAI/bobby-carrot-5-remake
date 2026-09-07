import { EntityTypeId } from "@bobby/model";
import { createDelayedMoveRuntimeAction } from "../../world/action/builtinActions.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  namedCell,
  staticEntity,
  SURFACE_STACK_ORDER,
} from "./module.js";

/** 同步 World 测试未配置 motion duration 时使用的普通移动回退值。 */
export const DEFAULT_ICE_SLIDE_CADENCE_MS = 350;

const slide: Behavior = {
  id: "ice-slide",
  onEnter({ actor, self, direction, movement, query, commands }) {
    if (!direction || !query.entityHasTrait(actor.id, "player")) return;
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
    : DEFAULT_ICE_SLIDE_CADENCE_MS;
}

const definition: EntityModuleDefinition = {
  type: EntityTypeId.ICE,
  traits: ["walkable", "forced-movement"],
  layer: "surface",
  stackOrder: SURFACE_STACK_ORDER,
  presentation: { name: "Ice" },
};

export const ice: EntityModule = staticEntity(
  definition,
  namedCell("ice"),
  [{ behavior: slide }],
);
