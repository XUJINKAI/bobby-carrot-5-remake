import { markerBehavior } from "../../mechanics/behaviors.js";
import { Terrain } from "../../mechanics/ids.js";
import type { TerrainRegistration } from "./index.js";

export function registerObjectives(ports: TerrainRegistration): void {
  ports.terrainDef(
    Terrain.EXIT,
    "objective",
    ["walkable", "exit"],
    [markerBehavior("level-exit", "由 rules.win 的 reach-terrain 条件判定通关")],
  );
}
