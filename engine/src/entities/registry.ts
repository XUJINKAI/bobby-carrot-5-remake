import { VisualRegistry } from "../visual/VisualRegistry.js";
import { BehaviorRegistry } from "../world/behavior/BehaviorRegistry.js";
import type { EntityRegistry } from "../world/entity/EntityRegistry.js";
import { EntityCatalog } from "./EntityCatalog.js";
import type { EntityModule } from "./EntityModule.js";
import { customEntityModules } from "./custom/modules.js";
import { originalEntityModules } from "./original/modules.js";

/** Source folders只用于维护；运行时通过同一份 EntityModule 列表完成 composition。 */
export const builtinEntityModules: readonly EntityModule[] = [
  ...originalEntityModules,
  ...customEntityModules,
];

export const builtinEntityDefinitions = builtinEntityModules.map(
  (module) => module.definition,
);

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
      const { behavior, trait } = binding;
      if (!seen.has(behavior.id)) {
        seen.add(behavior.id);
        registry.register(behavior);
      }
      if (trait) registry.bindTrait(trait, behavior.id);
    }
  }
  return registry;
}

export const entityCatalog = createBuiltinEntityCatalog();
export const entityRegistry = entityCatalog.entities;
export const visualRegistry = createBuiltinVisualRegistry();
export const behaviorRegistry = createBuiltinBehaviorRegistry();
