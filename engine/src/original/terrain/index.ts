import type { TerrainType } from "../../data/types.js";
import type { TileBehavior } from "../../mechanics/behaviors.js";
import type { TileTrait } from "../../mechanics/definition-types.js";
import { registerGround } from "./ground.js";
import { registerHazards } from "./hazards.js";
import { registerMovement } from "./movement.js";
import { registerObjectives } from "./objectives.js";
import { registerPickups } from "./pickups.js";
import { registerSwitches } from "./switches.js";
import { registerWater } from "./water.js";

export interface TerrainRegistration {
  terrainDef(id: TerrainType, category: string, traits: TileTrait[], behaviors: TileBehavior[]): void;
}

export function registerOriginalTerrainDefinitions(ports: TerrainRegistration): void {
  registerGround(ports);
  registerWater(ports);
  registerMovement(ports);
  registerHazards(ports);
  registerPickups(ports);
  registerSwitches(ports);
  registerObjectives(ports);
}
