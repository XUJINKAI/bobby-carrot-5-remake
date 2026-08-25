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

export function registerWater(ports: TerrainRegistration): void {
  const { terrainDef } = ports;
  for (const id of [
    Terrain.WATER,
    Terrain.WATER_ANIMATED,
    Terrain.TIDE_UP,
    Terrain.TIDE_DOWN,
    Terrain.TIDE_LEFT,
    Terrain.TIDE_RIGHT,
    Terrain.WATER_VARIANT_1,
    Terrain.WATER_VARIANT_2,
    Terrain.WATER_VARIANT_3,
  ])
    terrainDef(
      id,
      "water",
      ["water"],
      [
        markerBehavior(
          "requires-overlay",
          "普通步行需要荷叶、木板或藤蔓等覆盖对象",
        ),
      ],
    );
}
