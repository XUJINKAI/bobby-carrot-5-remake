import type { EntityModule } from "../EntityModule.js";
import { portal } from "./portal.js";
import { pushGoal } from "./push-goal.js";
import { pushableBox } from "./pushable-box.js";

export const customEntityModules: readonly EntityModule[] = [
  pushGoal,
  pushableBox,
  portal,
];
