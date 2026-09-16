import type { EntityModule } from "../entities/EntityModule.js";
import { createBuiltinGoalRegistry } from "../entities/goals.js";
import { bobbyActorPolicy } from "../entities/player/BobbyActorPolicy.js";
import {
  builtinEntityModules,
  createBuiltinBehaviorRegistry,
  createBuiltinEntityCatalog,
  createBuiltinRuntimeActionRegistry,
  createBuiltinVisualRegistry,
} from "../entities/registry.js";
import { createBuiltinFactRegistry } from "../fact/builtinFacts.js";
import type { FactRegistry } from "../fact/FactRegistry.js";
import { createBuiltinMechanismRegistry } from "../mechanism/builtinEntityMechanisms.js";
import type { MechanismRegistry } from "../mechanism/MechanismRegistry.js";
import { createBuiltinWorldCalloutRegistry } from "../visual/callout/builtinCallouts.js";
import type { WorldCalloutRegistry } from "../visual/callout/WorldCalloutRegistry.js";
import type { VisualRegistry } from "../visual/VisualRegistry.js";
import type { RuntimeActionRegistry } from "../world/action/RuntimeActionRegistry.js";
import type { ActorPolicy } from "../world/actor/ActorPolicy.js";
import type { BehaviorRegistry } from "../world/behavior/BehaviorRegistry.js";
import type { GoalRegistry } from "../world/outcome/GoalRegistry.js";
import type { EntityCatalog } from "../entities/EntityCatalog.js";

/**
 * Engine 各层共享的一致能力集合。容器本身不可变；需要扩展时应组合一份新环境，
 * 不要让 World、表现层或 Editor 分别创建互不匹配的 Registry。
 */
export interface EngineEnvironment {
  readonly catalog: EntityCatalog;
  readonly facts: FactRegistry;
  readonly mechanisms: MechanismRegistry;
  readonly behaviors: BehaviorRegistry;
  readonly actions: RuntimeActionRegistry;
  readonly goals: GoalRegistry;
  readonly visuals: VisualRegistry;
  readonly callouts: WorldCalloutRegistry;
  readonly actorPolicy: ActorPolicy;
}

export interface EngineEnvironmentOptions {
  modules?: readonly EntityModule[];
  facts?: FactRegistry;
  mechanisms?: MechanismRegistry;
  behaviors?: BehaviorRegistry;
  actions?: RuntimeActionRegistry;
  goals?: GoalRegistry;
  visuals?: VisualRegistry;
  callouts?: WorldCalloutRegistry;
  actorPolicy?: ActorPolicy;
}

export function createEngineEnvironment(
  options: EngineEnvironmentOptions = {},
): EngineEnvironment {
  const modules = options.modules ?? builtinEntityModules;
  const catalog = createBuiltinEntityCatalog(modules);
  const facts = options.facts ?? createBuiltinFactRegistry();
  const mechanisms = options.mechanisms ?? createBuiltinMechanismRegistry();
  const behaviors = options.behaviors ?? createBuiltinBehaviorRegistry(modules);

  for (const definition of catalog.all()) {
    for (const mechanism of definition.mechanisms ?? [])
      mechanisms.require(mechanism);
    for (const fact of [
      ...definition.presenceFacts,
      ...(definition.entityFacts ?? []),
    ]) facts.require(fact);
    const footprint = definition.footprint;
    const parts = footprint && "parts" in footprint
      ? footprint.parts
      : Object.values(footprint?.byDirection ?? {}).flat();
    for (const part of parts) {
      for (const fact of part?.presenceFacts ?? []) facts.require(fact);
    }
    for (const behavior of definition.behaviors ?? [])
      behaviors.require(behavior);
  }

  return Object.freeze({
    catalog,
    facts,
    mechanisms,
    behaviors,
    actions: options.actions ?? createBuiltinRuntimeActionRegistry(modules),
    goals: options.goals ?? createBuiltinGoalRegistry(),
    visuals: options.visuals ?? createBuiltinVisualRegistry(modules),
    callouts: options.callouts ?? createBuiltinWorldCalloutRegistry(),
    actorPolicy: options.actorPolicy ?? bobbyActorPolicy,
  });
}

export const builtinEngineEnvironment = createEngineEnvironment();
