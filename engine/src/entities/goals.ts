import { GOAL_TYPES, type GoalType } from "@bobby/model";
import type { EngineEnvironment } from "../environment/EngineEnvironment.js";
import { WorldQueryApi } from "../world/behavior/WorldQueryApi.js";
import type { EntityStore } from "../world/entity/EntityStore.js";
import { createGlobalState } from "../world/GlobalState.js";
import { GoalRegistry } from "../world/outcome/GoalRegistry.js";
import type { SpatialIndex } from "../world/spatial/SpatialIndex.js";
import { pushGoal } from "./custom/goals/pushGoal.js";
import { carrotGoal } from "./original/goals/carrotGoal.js";
import { eggGoal } from "./original/goals/eggGoal.js";
import { exitGoal } from "./original/goals/exitGoal.js";
import { goldenCarrotGoal } from "./original/goals/goldenCarrotGoal.js";

export function createBuiltinGoalRegistry(): GoalRegistry {
  const registry = new GoalRegistry();
  for (const definition of [carrotGoal, eggGoal, exitGoal, pushGoal, goldenCarrotGoal]) {
    registry.register(definition);
  }
  for (const type of GOAL_TYPES) registry.require(type);
  return registry;
}

/** Editor 的可用性查询与运行 Goal 使用同一对象选择规则。 */
export function goalAvailable(
  type: GoalType,
  entities: EntityStore,
  spatial: SpatialIndex,
  environment: EngineEnvironment,
): boolean {
  const query = new WorldQueryApi(
    entities,
    spatial,
    createGlobalState,
    environment.facts,
  );
  return environment.goals.require(type).available(query);
}
