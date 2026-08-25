import type { TerrainType } from "../../data/types.js";
import {
  EMPTY_OBJECT,
  ObjectId,
  Terrain,
  type Direction,
} from "../../mechanics/ids.js";
import {
  directionalPassage,
  fireReflectionBehavior,
  enterBehavior,
  leaveBehavior,
  markerBehavior,
  passageBehavior,
  preEnterBehavior,
  rotateOnLeave,
  type TileBehavior,
} from "../../mechanics/behaviors.js";
import {
  environmentTraits,
  isWalkableSemantic,
  isWaterSemantic,
} from "../../mechanics/definition-semantics.js";
import {
  CAROUSEL_NEXT,
  rotateCarousel,
  toggleColor,
  toggleSpeed,
  toggleTide,
} from "../../mechanics/terrain-transforms.js";
import type { TileTrait } from "../../mechanics/definition-types.js";
import type { TerrainRegistration } from "./index.js";

export function registerObjectives(ports: TerrainRegistration): void {
  const { terrainDef } = ports;
  terrainDef(
    Terrain.EXIT,
    "objective",
    ["walkable", "exit"],
    [
      enterBehavior("complete-level", "主要目标清空后进入出口完成关卡", (ctx) => {
        if (
          ctx.mode === "normal" &&
          !ctx.state.ridingMower &&
          ctx.state.objectiveRemaining === 0 &&
          ctx.state.pushGoalsRemaining === 0
        ) {
          ctx.state.completed = true;
          ctx.state.forced = null;
          ctx.api.event("complete", "关卡完成");
        }
      }),
    ],
  );
}
