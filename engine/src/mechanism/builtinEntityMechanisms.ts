import { MechanismRegistry } from "./MechanismRegistry.js";
import { dialogBehavior } from "./entity/DialogBehavior.js";
import { objectInteractionBehavior } from "./entity/ObjectInteractionBehavior.js";
import { waterOverlayBehavior } from "./entity/WaterOverlayBehavior.js";
import { passageMechanism } from "./pipeline/PassageMechanism.js";
import { pushMechanism } from "./pipeline/PushMechanism.js";

export function createBuiltinMechanismRegistry(): MechanismRegistry {
  const registry = new MechanismRegistry();
  registry.registerAll([
    { id: "dialog", behaviors: [dialogBehavior] },
    { id: "object-interaction", behaviors: [objectInteractionBehavior] },
    { id: "water-overlay", behaviors: [waterOverlayBehavior] },
  ]);
  registry.registerPassage(passageMechanism);
  registry.registerPush(pushMechanism);
  return registry;
}
