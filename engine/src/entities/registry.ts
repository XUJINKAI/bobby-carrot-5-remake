import { EntityRegistry } from "../world/entity/EntityRegistry.js";
import { customEntityDefinitions } from "./custom/definitions.js";
import { originalEntityDefinitions } from "./original/definitions.js";

/**
 * Source folders are only for maintainability. Registry receives one flat Definition list and
 * carries no original/custom distinction at runtime or in authoring.
 */
export const builtinEntityDefinitions = [
  ...originalEntityDefinitions,
  ...customEntityDefinitions,
] as const;

export function createBuiltinEntityRegistry(): EntityRegistry {
  const registry = new EntityRegistry();
  registry.registerAll(builtinEntityDefinitions);
  return registry;
}

export const entityRegistry = createBuiltinEntityRegistry();
