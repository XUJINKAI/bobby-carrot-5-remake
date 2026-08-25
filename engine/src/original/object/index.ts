import type { ObjectType } from "../../data/types.js";
import type { TileBehavior } from "../../mechanics/behaviors.js";
import type { TileDefinition, TileTrait } from "../../mechanics/definition-types.js";
import { registerCharacters } from "./characters.js";
import { registerCollectibles } from "./collectibles.js";
import { registerDynamic } from "./dynamic.js";
import { registerMachines } from "./machines.js";
import { registerObstacles } from "./obstacles.js";
import { registerPickups } from "./pickups.js";
import { registerStructures } from "./structures.js";

export interface ObjectRegistration {
  object(definition: TileDefinition<ObjectType>): void;
  objectDef(id: ObjectType, category: string, traits: TileTrait[], behaviors: TileBehavior[]): void;
}

export function registerOriginalObjectDefinitions(ports: ObjectRegistration): void {
  registerStructures(ports);
  registerMachines(ports);
  registerDynamic(ports);
  registerObstacles(ports);
  registerCollectibles(ports);
  registerPickups(ports);
  registerCharacters(ports);
}
