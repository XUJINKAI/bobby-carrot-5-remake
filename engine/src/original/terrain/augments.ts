import { Terrain } from "../../mechanics/ids.js";
import { markerBehavior, type TileBehavior } from "../../mechanics/behaviors.js";
import type { DefinitionRegistrationPorts } from "../../mechanics/definition/registration.js";

export function applyTerrainDefinitionAugments(
  ports: DefinitionRegistrationPorts,
): void {
  ports.defineTerrain(
    Terrain.START,
    "marker",
    ["start"],
    [markerBehavior("start-position", "Bobby 的出生点")],
  );
  ports.defineTerrain(
    Terrain.HIGH_GRASS_OBJECTIVE,
    "mower",
    ["terrain-passage-override", "hidden-objective"],
    ports.getTerrain(Terrain.HIGH_GRASS_OBJECTIVE).behaviors as TileBehavior[],
  );
}
