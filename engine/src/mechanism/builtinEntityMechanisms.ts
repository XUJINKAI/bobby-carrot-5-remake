import { MechanismRegistry } from "./MechanismRegistry.js";
import { dialogBehavior } from "./entity/DialogBehavior.js";
import { objectInteractionBehavior } from "./entity/ObjectInteractionBehavior.js";
import { waterOverlayBehavior } from "./entity/WaterOverlayBehavior.js";

export function createBuiltinMechanismRegistry(): MechanismRegistry {
  const registry = new MechanismRegistry();
  registry.registerAll([
    { id: "dialog", behaviors: [dialogBehavior] },
    { id: "object-interaction", behaviors: [objectInteractionBehavior] },
    { id: "water-overlay", behaviors: [waterOverlayBehavior] },
  ]);
  return registry;
}
