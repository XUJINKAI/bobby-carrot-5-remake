import type { LevelMap } from "@bobby/model";
import { World, type WorldOptions } from "../world/World.js";
import { bobbyActorPolicy } from "./player/BobbyActorPolicy.js";
import { goalRegistry } from "./goals.js";
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
    facts: options.facts ?? factRegistry,
    goals: options.goals ?? goalRegistry,
    actorPolicy: options.actorPolicy ?? bobbyActorPolicy,
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
