import { MechanismRegistry } from "./MechanismRegistry.js";
import { dialogBehavior } from "./entity/DialogBehavior.js";
import { objectInteractionBehavior } from "./entity/ObjectInteractionBehavior.js";
import { passageMechanism } from "./pipeline/PassageMechanism.js";
import { pushMechanism } from "./pipeline/PushMechanism.js";
import { builtinWorldMetricsMechanism } from "./pipeline/BuiltinWorldMetricsMechanism.js";

export function createBuiltinMechanismRegistry(): MechanismRegistry {
  const registry = new MechanismRegistry();
  registry.registerAll([
    { id: "dialog", behaviors: [dialogBehavior] },
    { id: "object-interaction", behaviors: [objectInteractionBehavior] },
  ]);
  registry.registerPassage(passageMechanism);
  registry.registerPush(pushMechanism);
  registry.registerMetrics(builtinWorldMetricsMechanism);
  return registry;
}
