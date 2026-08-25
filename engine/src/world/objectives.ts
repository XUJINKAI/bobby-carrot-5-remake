import type { ObjectType, TerrainType } from "../data/types.js";
import { CustomTerrain, EMPTY_OBJECT, ObjectId } from "../mechanics/ids.js";
import {
  objectHasTrait,
  terrainHasTrait,
} from "../mechanics/definitions.js";
import type { ObjectiveMode } from "./RuntimeState.js";

export interface InitialObjectives {
  mode: ObjectiveMode;
  total: number;
  remaining: number;
}

export function deriveInitialObjectives(
  terrain: TerrainType[][],
  objects: ObjectType[][],
): InitialObjectives {
  let carrotCount = 0;
  let nestCount = 0;
  let hiddenCount = 0;
  let rockGoalCount = 0;
  let filledRockGoalCount = 0;
  for (let y = 0; y < terrain.length; y++)
    for (let x = 0; x < (terrain[y]?.length ?? 0); x++) {
      const object = objects[y]![x]!;
      if (objectHasTrait(object, "objective-carrot")) carrotCount++;
      if (objectHasTrait(object, "objective-nest")) nestCount++;
      if (terrain[y]![x] === CustomTerrain.ROCK_GOAL) {
        rockGoalCount++;
        if (object === ObjectId.CRUMBLY_ROCK) filledRockGoalCount++;
      }
      if (
        terrainHasTrait(terrain[y]![x]!, "hidden-objective") &&
        object === EMPTY_OBJECT
      )
        hiddenCount++;
    }
  const mode = carrotCount > 0 ? "carrot" : "nest";
  const visible = mode === "carrot" ? carrotCount : nestCount;
  const total = rockGoalCount > 0 ? rockGoalCount : visible + hiddenCount;
  return {
    mode,
    total,
    remaining: rockGoalCount > 0 ? rockGoalCount - filledRockGoalCount : total,
  };
}
