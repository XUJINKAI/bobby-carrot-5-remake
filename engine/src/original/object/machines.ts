import type { ObjectType } from "../../data/types.js";
import { EMPTY_OBJECT, ObjectId } from "../../mechanics/ids.js";
import {
  enterBehavior,
  leaveBehavior,
  markerBehavior,
  passageBehavior,
  type TileBehavior,
} from "../../mechanics/behaviors.js";
import {
  DYNAMIC_IDS,
  HIDDEN_AUTHORING_OBJECTS,
} from "../../mechanics/definition-semantics.js";
import type {
  TileDefinition,
  TileTrait,
} from "../../mechanics/definition-types.js";

import type { ObjectRegistration } from "./index.js";

export function registerMachines(ports: ObjectRegistration): void {
  const { object, objectDef } = ports;
  objectDef(
    ObjectId.MOWER,
    "vehicle",
    ["object-passage-override"],
    [
      passageBehavior("board-mower", "取得汽油后可登上割草机", (ctx) => {
        if (ctx.state.ridingMower)
          return {
            passable: false,
            reason: "已经在驾驶割草机",
            confidence: "inferred",
          };
        return ctx.state.inventory.gas
          ? {
              passable: true,
              boardsMower: true,
              reason: "登上已加油的割草机",
              confidence: "confirmed",
            }
          : {
              passable: false,
              reason: "割草机需要先取得汽油",
              confidence: "confirmed",
            };
      }),
    ],
  );
}
