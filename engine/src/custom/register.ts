import type { DefinitionRegistrationPorts } from "../mechanics/definition/registration.js";
import { registerPortal } from "./object/portal.js";
import { registerPushGoal } from "./terrain/push-goal.js";

export function registerCustomDefinitions(
  ports: DefinitionRegistrationPorts,
): void {
  registerPushGoal(ports);
  registerPortal(ports);
}
