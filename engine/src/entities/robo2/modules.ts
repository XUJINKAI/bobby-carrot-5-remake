import type { EntityModule } from "../EntityModule.js";
import { laserBomb } from "./laser-bomb.js";
import { laserBeam, laserCannon, laserSystem } from "./laser-cannon.js";
import { laserMirror } from "./laser-mirror.js";
import { laserStone } from "./laser-stone.js";

export const robo2EntityModules: readonly EntityModule[] = [
  laserStone,
  laserCannon,
  laserBeam,
  laserSystem,
  laserMirror,
  laserBomb,
];
