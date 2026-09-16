import type { LevelMap } from "@bobby/model";
import {
  builtinEngineEnvironment,
  type EngineEnvironment,
} from "../environment/EngineEnvironment.js";
import { World, type WorldOptions } from "../world/World.js";

/** Engine 组合入口负责把具体对象接入纯 World kernel。 */
export function composeWorldOptions(
  options: Partial<WorldOptions> = {},
  environment: EngineEnvironment = builtinEngineEnvironment,
): WorldOptions {
  return {
    entities: options.entities ?? environment.catalog.entities,
    behaviors: options.behaviors ?? environment.behaviors,
    mechanisms: options.mechanisms ?? environment.mechanisms,
    actions: options.actions ?? environment.actions,
    facts: options.facts ?? environment.facts,
    goals: options.goals ?? environment.goals,
    actorPolicy: options.actorPolicy ?? environment.actorPolicy,
    ...(options.motionDurationMs !== undefined
      ? { motionDurationMs: options.motionDurationMs }
      : {}),
  };
}

export function createWorld(
  level: LevelMap,
  environment: EngineEnvironment = builtinEngineEnvironment,
  options: Partial<WorldOptions> = {},
): World {
  return new World(level, composeWorldOptions(options, environment));
}
