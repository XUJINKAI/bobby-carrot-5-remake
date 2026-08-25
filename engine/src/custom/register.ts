import type { DefinitionRegistrationPorts } from "../mechanics/definition/registration.js";
import { registerPortal } from "./object/portal.js";
import { registerRockGoal } from "./terrain/rock-goal.js";

export function registerCustomDefinitions(
  ports: DefinitionRegistrationPorts,
): void {
  registerRockGoal(ports);
  registerPortal(ports);
}
