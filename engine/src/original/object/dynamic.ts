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

export function registerDynamic(ports: ObjectRegistration): void {
  const { object, objectDef } = ports;
  objectDef(
    ObjectId.WHIRLWIND,
    "flight",
    ["object-passage-override"],
    [
      passageBehavior("requires-kite", "取得风筝后进入飞行状态", (ctx) => {
        if (ctx.state.ridingMower)
          return {
            passable: false,
            reason: "割草机不能进入龙卷风",
            confidence: "confirmed",
          };
        return ctx.state.inventory.kite
          ? {
              passable: true,
              startsFlight: true,
              reason: "风筝被龙卷风带起",
              confidence: "confirmed",
            }
          : {
              passable: false,
              reason: "需要风筝才能进入龙卷风",
              confidence: "confirmed",
            };
      }),
    ],
  );
  objectDef(
    ObjectId.LANDING,
    "flight",
    [],
    [
      enterBehavior("land-flight", "飞行状态进入降落点后结束强制飞行", (ctx) => {
        if (ctx.state.forced?.kind === "flight") ctx.state.forced = null;
      }),
    ],
  );
}
