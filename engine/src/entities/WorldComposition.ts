import type { LevelMap } from "@bobby/model";
import { World, type WorldOptions } from "../world/World.js";
import { bobbyActorPolicy } from "./player/BobbyActorPolicy.js";
import { initializeOriginalLevelEntity } from "./original/initialize-level-entity.js";
import {
  behaviorRegistry,
  createBuiltinRuntimeActionRegistry,
  entityRegistry,
  factRegistry,
  mechanismRegistry,
} from "./registry.js";

/** Engine 组合入口负责把具体对象接入纯 World kernel。 */
export function composeWorldOptions(
  options: Partial<WorldOptions> = {},
): WorldOptions {
  return {
    entities: options.entities ?? entityRegistry,
    behaviors: options.behaviors ?? behaviorRegistry,
    mechanisms: options.mechanisms ?? mechanismRegistry,
    actions: options.actions ?? createBuiltinRuntimeActionRegistry(),
    ...(options.facts !== undefined || options.entities === undefined
      ? { facts: options.facts ?? factRegistry }
      : {}),
    actorPolicy: options.actorPolicy ?? bobbyActorPolicy,
    initializeLevelEntity:
      options.initializeLevelEntity ?? initializeOriginalLevelEntity,
    ...(options.motionDurationMs !== undefined
      ? { motionDurationMs: options.motionDurationMs }
      : {}),
  };
}

export function createWorld(
  level: LevelMap,
  options: Partial<WorldOptions> = {},
): World {
  return new World(level, composeWorldOptions(options));
}
