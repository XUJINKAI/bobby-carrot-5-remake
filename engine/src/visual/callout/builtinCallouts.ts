import { missingItemCalloutDefinition } from "./missingItemCallout.js";
import { WorldCalloutRegistry } from "./WorldCalloutRegistry.js";

/** Engine 正式 Session 使用的内置地图提示集合。 */
export function createBuiltinWorldCalloutRegistry(): WorldCalloutRegistry {
  const registry = new WorldCalloutRegistry();
  registry.register(missingItemCalloutDefinition);
  return registry;
}
