import { markerBehavior } from "../../mechanics/behaviors.js";
import type { DefinitionRegistrationPorts } from "../../mechanics/definition/registration.js";
import { CustomTerrain } from "../../mechanics/ids.js";

export function registerPushGoal(ports: DefinitionRegistrationPorts): void {
  ports.defineTerrain(
    CustomTerrain.PUSH_GOAL,
    "custom-objective",
    ["walkable", "push-goal"],
    [markerBehavior("push-goal", "Crumbly Rock 推入后完成目标")],
  );
}
