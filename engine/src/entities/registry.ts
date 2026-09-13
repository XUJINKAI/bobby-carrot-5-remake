import { VisualRegistry } from "../visual/VisualRegistry.js";
import { createBuiltinFactRegistry } from "../fact/builtinFacts.js";
import { createBuiltinMechanismRegistry } from "../mechanism/builtinEntityMechanisms.js";
import {
  createBuiltinRuntimeActionRegistry as createCoreRuntimeActionRegistry,
} from "../world/action/builtinActions.js";
import { BehaviorRegistry } from "../world/behavior/BehaviorRegistry.js";
import type { EntityRegistry } from "../world/entity/EntityRegistry.js";
import { EntityCatalog } from "./EntityCatalog.js";
import type { EntityModule } from "./EntityModule.js";
import { customEntityModules } from "./custom/modules.js";
import { originalEntityModules } from "./original/modules.js";
import { playerEntityModules } from "./player/modules.js";

/** Source folders只用于维护；运行时通过同一份 EntityModule 列表完成 composition。 */
export const builtinEntityModules: readonly EntityModule[] = [
  ...playerEntityModules,
  ...originalEntityModules,
  ...customEntityModules,
];

export const builtinEntityDefinitions = builtinEntityModules.map(
  (module) => module.definition,
);

export const factRegistry = createBuiltinFactRegistry();
export const mechanismRegistry = createBuiltinMechanismRegistry();
for (const definition of builtinEntityDefinitions) {
  for (const mechanism of definition.mechanisms ?? []) {
    mechanismRegistry.require(mechanism);
  }
  for (const fact of [...definition.facts, ...(definition.entityFacts ?? [])]) {
    factRegistry.require(fact);
  }
  const footprint = definition.footprint;
  const parts = footprint && "parts" in footprint
    ? footprint.parts
    : Object.values(footprint?.byDirection ?? {}).flat();
  for (const part of parts) {
    for (const fact of part?.facts ?? []) factRegistry.require(fact);
  }
}

export function createBuiltinEntityCatalog(
  modules: readonly EntityModule[] = builtinEntityModules,
): EntityCatalog {
  return new EntityCatalog(modules);
}

export function createBuiltinEntityRegistry(
  modules: readonly EntityModule[] = builtinEntityModules,
): EntityRegistry {
  return createBuiltinEntityCatalog(modules).entities;
}

export function createBuiltinVisualRegistry(
  modules: readonly EntityModule[] = builtinEntityModules,
): VisualRegistry {
  const registry = new VisualRegistry();
  const seen = new Set<string>();
  for (const module of modules) {
    if (!module.visual || seen.has(module.visual.id)) continue;
    seen.add(module.visual.id);
    registry.register(module.visual);
  }
  for (const module of modules) {
    const visualId = module.presentation.visual ?? module.visual?.id;
    if (visualId) registry.bindEntityVisual(module.definition.type, visualId);
    for (const transient of module.transientVisuals ?? [])
      registry.registerTransient(transient);
  }
  return registry;
}

export function createBuiltinBehaviorRegistry(
  modules: readonly EntityModule[] = builtinEntityModules,
): BehaviorRegistry {
  const registry = new BehaviorRegistry();
  const seen = new Set<string>();
  for (const module of modules) {
    for (const binding of module.behaviorBindings ?? []) {
      const { behavior } = binding;
      if (!seen.has(behavior.id)) {
        seen.add(behavior.id);
        registry.register(behavior);
      }
    }
  }
  return registry;
}

export function createBuiltinRuntimeActionRegistry(
  modules: readonly EntityModule[] = builtinEntityModules,
) {
  const registry = createCoreRuntimeActionRegistry();
  for (const module of modules)
    for (const action of module.runtimeActions ?? []) registry.register(action);
  return registry;
}

export const entityCatalog = createBuiltinEntityCatalog();
export const entityRegistry = entityCatalog.entities;
export const visualRegistry = createBuiltinVisualRegistry();
export const behaviorRegistry = createBuiltinBehaviorRegistry();
for (const definition of builtinEntityDefinitions) {
  for (const behavior of definition.behaviors ?? []) {
    behaviorRegistry.require(behavior);
  }
}
