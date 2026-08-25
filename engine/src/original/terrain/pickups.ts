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

export function registerPickups(ports: TerrainRegistration): void {
  const { terrainDef } = ports;
  terrainDef(
    Terrain.SHOVEL_PICKUP,
    "pickup",
    ["walkable", "pickup"],
    [
      enterBehavior(
        "collect-shovel",
        "取得雪铲并把地形变为清理后的地面",
        (ctx) => {
          if (ctx.mode !== "normal") return;
          ctx.state.inventory.shovel = true;
          ctx.api.setTerrain(Terrain.SHOVEL_CLEARED_GROUND);
          ctx.api.event("collect-shovel", "取得雪铲");
        },
      ),
    ],
  );
}
