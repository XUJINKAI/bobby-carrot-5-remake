import type { EntityModule } from "../EntityModule.js";
import { laserBomb } from "./laser-bomb.js";
import { laserBeam, laserEmitter, laserSystem } from "./laser-emitter.js";
import { laserMirror } from "./laser-mirror.js";
import { laserStone } from "./laser-stone.js";
import { portal } from "./portal.js";
import { pushGoal } from "./push-goal.js";
import { pushableBox } from "./pushable-box.js";

export const customEntityModules: readonly EntityModule[] = [
  pushGoal,
  pushableBox,
  laserStone,
  laserEmitter,
  laserBeam,
  laserSystem,
  laserMirror,
  laserBomb,
  portal,
];
