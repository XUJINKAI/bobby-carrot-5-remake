import type { MechanismRegistry } from "../../mechanism/MechanismRegistry.js";
import type { EntityDefinition } from "../entity/EntityDefinition.js";
import type { Behavior } from "./Behavior.js";
import type { BehaviorRegistry } from "./BehaviorRegistry.js";

/** 机制 hook 先于对象特例；Behavior ID 在两处出现时只执行一次。 */
export function resolveEffectiveBehaviors(
  definition: EntityDefinition,
  behaviors: BehaviorRegistry,
  mechanisms: MechanismRegistry,
): readonly Behavior[] {
  const result = new Map<string, Behavior>();
  for (const behavior of mechanisms.behaviorsFor(definition.mechanisms)) {
    result.set(behavior.id, behavior);
  }
  for (const behavior of behaviors.resolve(definition.behaviors)) {
    if (!result.has(behavior.id)) result.set(behavior.id, behavior);
  }
  return [...result.values()];
}
