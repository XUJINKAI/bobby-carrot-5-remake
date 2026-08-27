import type { WinCondition } from "@bobby/model";
import type { RuntimeState } from "../../world/RuntimeState.js";
import type { TileTrait } from "../definition-types.js";
import { terrainHasTrait } from "../definitions.js";
import { effectiveObjectHasTrait } from "../traits/effective.js";

export function isWinConditionSatisfied(
  condition: WinCondition,
  state: RuntimeState,
): boolean {
  switch (condition.type) {
    case "all":
      return condition.conditions.every((item) =>
        isWinConditionSatisfied(item, state),
      );
    case "any":
      return condition.conditions.some((item) =>
        isWinConditionSatisfied(item, state),
      );
    case "collect-all":
      return (
        condition.trait === "level-objective" && state.objectiveRemaining === 0
      );
    case "fill-all":
      return fillAllSatisfied(
        state,
        condition.targetTrait as TileTrait,
        condition.fillerTrait as TileTrait,
      );
    case "reach": {
      const terrain = state.terrain[state.player.y]?.[state.player.x];
      return (
        terrain !== undefined &&
        terrainHasTrait(terrain, condition.trait as TileTrait)
      );
    }
  }
}

function fillAllSatisfied(
  state: RuntimeState,
  targetTrait: TileTrait,
  fillerTrait: TileTrait,
): boolean {
  let targets = 0;
  for (let y = 0; y < state.terrain.length; y += 1)
    for (let x = 0; x < (state.terrain[y]?.length ?? 0); x += 1) {
      const terrain = state.terrain[y]![x]!;
      if (!terrainHasTrait(terrain, targetTrait)) continue;
      targets += 1;
      if (
        !effectiveObjectHasTrait(
          state.objects[y]![x]!,
          state.objectTraits[y]?.[x],
          fillerTrait,
        )
      )
        return false;
    }
  return targets > 0;
}
