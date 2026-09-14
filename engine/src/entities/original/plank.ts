import { MapEntityTypeId } from "@bobby/model";
import type { TransientVisualDefinition } from "../../visual/VisualDefinition.js";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import {
  atlasVisual,
  tileAnimationCell,
  tileCell,
  originalModule,
} from "./module.js";

const ORIGINAL_GAMEPLAY_STEP_MS = 31;
export const PLANK_DECAY_PHASE_MS = 6 * ORIGINAL_GAMEPLAY_STEP_MS;
export const PLANK_DECAY_DURATION_MS = 2 * PLANK_DECAY_PHASE_MS;

const plankPassage: Behavior = {
  id: "plank-passage",
  canEnter({ actor }) {
    if (bobbyMountId(actor.state) === null)
      return { passable: true, reason: "plank-bridge" };
  },
  onLeave({ actor, self, query, commands }) {
    if (
      !query.entityHasFact(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return;

    // 游戏通行在离开时立即结束；后续碎裂帧仅由表现层播放。
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
  type: MapEntityTypeId.PLANK,
  facts: ["contact-cover", "walkable"],
  presentation: { name: "Plank" },
};

const plankDecayVisual: TransientVisualDefinition = {
  id: "plank-decay",
  eventType: "plank-decay-started",
  durationMs: PLANK_DECAY_DURATION_MS,
  renderPass: "world",
  resolve({ progress }) {
    const atlas = tileAnimationCell(
      MapEntityTypeId.PLANK,
      "crumbling",
      progress < 0.5 ? 1 : 2,
    );
    return {
      layers: [{ kind: "atlas", column: atlas.column, row: atlas.row }],
    };
  },
};

const module = originalModule(
  definition,
  atlasVisual(definition, tileCell(MapEntityTypeId.PLANK)),
  [{ behavior: plankPassage }],
);

export const plank: EntityModule = {
  ...module,
  transientVisuals: [plankDecayVisual],
};
