import { EntityTypeId } from "@bobby/model";
import type { TransientVisualDefinition } from "../../visual/VisualDefinition.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const ORIGINAL_GAMEPLAY_STEP_MS = 31;
export const PLANK_DECAY_PHASE_MS = 6 * ORIGINAL_GAMEPLAY_STEP_MS;
export const PLANK_DECAY_DURATION_MS = 2 * PLANK_DECAY_PHASE_MS;

const plankPassage: Behavior = {
  id: "plank-passage",
  canEnter({ actor, self, query }) {
    const underlyingWalkable = query
      .presencesAt(self.presence.cell)
      .some(
        (presence) =>
          presence.entityId !== self.entity.id &&
          presence.layer === "surface" &&
          presence.traits.includes("walkable"),
      );
    if (bobbyMountId(actor.state) !== null && !underlyingWalkable)
      return { passable: false, reason: "mower-cannot-use-plank-bridge" };
    return { passable: true, reason: "plank-bridge" };
  },
  onLeave({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return;

    // Gameplay ends immediately. D5/D6 are a Presentation-only corpse animation.
    commands.destroy(self.entity.id);
    commands.emit({
      type: "plank-decay-started",
      entityId: self.entity.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

const definition: EntityModuleDefinition = {
  type: EntityTypeId.PLANK,
  traits: ["terrain-overlay", "walkable"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Plank" },
};

const plankDecayVisual: TransientVisualDefinition = {
  id: "plank-decay",
  eventType: "plank-decay-started",
  durationMs: PLANK_DECAY_DURATION_MS,
  renderPass: "world",
  stackOrder: CONTENT_STACK_ORDER,
  resolve({ progress }) {
    const atlas = objectCell(progress < 0.5 ? 12 : 13);
    return {
      layers: [{ kind: "atlas", column: atlas.column, row: atlas.row }],
    };
  },
};

const module = originalModule(
  definition,
  atlasVisual(definition, objectCell(11)),
  [{ behavior: plankPassage }],
);

export const plank: EntityModule = {
  ...module,
  transientVisuals: [plankDecayVisual],
};
