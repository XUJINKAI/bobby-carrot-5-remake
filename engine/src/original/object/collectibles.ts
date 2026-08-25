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

export function registerCollectibles(ports: ObjectRegistration): void {
  const { object, objectDef } = ports;
  objectDef(
    ObjectId.CARROT,
    "collectible",
    ["collectible", "objective-carrot"],
    [
      enterBehavior("collect-carrot", "收集主要目标胡萝卜", (ctx) => {
        if (ctx.mode === "normal") {
          ctx.state.objectiveRemaining = Math.max(
            0,
            ctx.state.objectiveRemaining - 1,
          );
          ctx.api.setObject(ObjectId.CONSUMED_CARROT);
          ctx.api.event("collect-carrot", "收集胡萝卜");
        }
      }),
    ],
  );
  objectDef(
    ObjectId.EGG_NEST_EMPTY,
    "objective",
    ["collectible", "objective-nest"],
    [
      leaveBehavior("fill-nest-on-leave", "离开空蛋巢时完成该目标", (ctx) => {
        ctx.api.setObject(ObjectId.EGG_NEST_FILLED);
        ctx.state.objectiveRemaining = Math.max(
          0,
          ctx.state.objectiveRemaining - 1,
        );
        ctx.api.event("fill-nest", "填满一个彩蛋巢");
      }),
    ],
  );
  objectDef(
    ObjectId.GOLDEN_CARROT,
    "collectible",
    ["collectible"],
    [
      enterBehavior("collect-golden-carrot", "取得金胡萝卜", (ctx) => {
        ctx.state.goldenCarrotsInLevel += 1;
        ctx.api.setObject(EMPTY_OBJECT);
        ctx.api.event(
          "collect-golden-carrot",
          ctx.mode === "flight" ? "飞行中取得金胡萝卜" : "取得金胡萝卜",
        );
      }),
    ],
  );
  objectDef(
    ObjectId.BONUS_COIN,
    "collectible",
    ["collectible"],
    [
      enterBehavior("collect-bonus-coin", "取得 Bonus Coin", (ctx) => {
        ctx.state.bonusCoinsInLevel += 1;
        ctx.api.setObject(EMPTY_OBJECT);
        ctx.api.event(
          "collect-bonus-coin",
          ctx.mode === "flight" ? "飞行中取得 Bonus Coin" : "取得 Bonus Coin",
        );
      }),
    ],
  );
}
