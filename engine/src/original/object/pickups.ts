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

export function registerPickups(ports: ObjectRegistration): void {
  const { object, objectDef } = ports;
  objectDef(
    ObjectId.GAS,
    "pickup",
    ["pickup"],
    [
      enterBehavior("collect-gas", "取得割草机汽油", (ctx) => {
        if (ctx.mode === "normal") {
          ctx.state.inventory.gas = true;
          ctx.api.setObject(EMPTY_OBJECT);
          ctx.api.event("collect-gas", "取得割草机汽油，本关永久有效");
        }
      }),
    ],
  );
  objectDef(
    ObjectId.KITE,
    "pickup",
    ["pickup"],
    [
      enterBehavior("collect-kite", "取得风筝", (ctx) => {
        if (ctx.mode === "normal") {
          ctx.state.inventory.kite = true;
          ctx.api.setObject(EMPTY_OBJECT);
          ctx.api.event("collect-kite", "取得风筝");
        }
      }),
    ],
  );
  objectDef(
    ObjectId.BEAN,
    "pickup",
    ["pickup"],
    [
      enterBehavior("collect-bean", "取得魔豆", (ctx) => {
        if (ctx.mode === "normal") {
          ctx.state.inventory.beans += 1;
          ctx.api.setObject(EMPTY_OBJECT);
          ctx.api.event("collect-bean", "取得魔豆");
        }
      }),
    ],
  );
}
