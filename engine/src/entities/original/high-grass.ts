import { MapEntityTypeId } from "@bobby/model";
import type {
  TransientVisualDefinition,
  VisualResolveContext,
} from "../../visual/VisualDefinition.js";
import type { EntityModule, EntityModuleDefinition } from "../EntityModule.js";
import { mowableBehavior } from "../behaviorLibrary.js";
import {
  atlasVisual,
  originalModule,
  tileCell,
} from "./module.js";

const MOW_EFFECT_FRAME_MS = 186;
const SPEED_MOW_EFFECT_FRAME_MS = 93;
const MOW_EFFECT_FRAME_COUNT = 4;

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.HIGH_GRASS,
  presenceFacts: ["blocking", "contact-cover"],
  presentation: { name: "High Grass" },
};

const mowEffect: TransientVisualDefinition = {
  id: "mow-high-grass",
  eventType: "mow",
  durationMs: (event) =>
    MOW_EFFECT_FRAME_COUNT *
    (event.data?.accelerated === true
      ? SPEED_MOW_EFFECT_FRAME_MS
      : MOW_EFFECT_FRAME_MS),
  renderPass: "effect",
  resolve({ progress }) {
    const frame = Math.min(
      MOW_EFFECT_FRAME_COUNT - 1,
      Math.floor(progress * MOW_EFFECT_FRAME_COUNT),
    );
    return {
      layers: [{
        kind: "image",
        asset: "bobby-speed-trail",
        frameColumns: 5,
        frameRows: 2,
        frameIndex: frame,
        anchor: "bottom",
        offsetY: -12,
      }],
    };
  },
};

const module = originalModule(
  definition,
  atlasVisual(definition, (context) =>
    tileCell(MapEntityTypeId.HIGH_GRASS, {
      ...(coversObjective(context) ? { phase: "objective" } : {}),
    }),
  ),
  [{ behavior: mowableBehavior }],
);

export const highGrass: EntityModule = {
  ...module,
  transientVisuals: [mowEffect],
};

function coversObjective(context: VisualResolveContext): boolean {
  // 同格叠放是 LevelMap 对高草隐藏目标的语义表达，见 docs/system/original/mechanics.md。
  return context.query.presencesAt(context.presence.cell).some((presence) => {
    const type = context.query.entity(presence.entityId)?.type;
    return type === MapEntityTypeId.CARROT || type === MapEntityTypeId.EGG;
  });
}
