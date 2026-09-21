import type { EntityModule } from "../EntityModule.js";
import { laserBeam, laserEmitter } from "./laser-emitter.js";
import { portal } from "./portal.js";
import { pushGoal } from "./push-goal.js";
import { pushableBox } from "./pushable-box.js";
import { pushableStone } from "./pushable-stone.js";

export const customEntityModules: readonly EntityModule[] = [
  pushGoal,
  pushableBox,
  pushableStone,
  laserEmitter,
  laserBeam,
  portal,
];
