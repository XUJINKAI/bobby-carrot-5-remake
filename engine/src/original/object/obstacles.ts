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

export function registerObstacles(ports: ObjectRegistration): void {
  const { object, objectDef } = ports;
  objectDef(
    ObjectId.CRUMBLY_ROCK,
    "mower",
    ["object-passage-override", "dragon-fire-blocking"],
    [
      passageBehavior("break-by-fast-mower", "高速割草机可以撞碎", (ctx) =>
        ctx.state.ridingMower && ctx.state.forced?.kind === "speed"
          ? {
              passable: true,
              reason: "高速割草机撞碎岩石",
              confidence: "confirmed",
            }
          : {
              passable: false,
              reason: "岩石需要高速割草机撞碎",
              confidence: "confirmed",
            },
      ),
      enterBehavior("break-on-enter", "高速割草机进入后移除岩石", (ctx) => {
        if (
          ctx.mode === "normal" &&
          ctx.state.ridingMower &&
          ctx.state.forced?.kind === "speed"
        ) {
          ctx.api.setObject(EMPTY_OBJECT);
          ctx.api.event("break-rock", "高速割草机撞碎岩石");
        }
      }),
    ],
  );
}
