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

export function registerCharacters(ports: ObjectRegistration): void {
  const { object, objectDef } = ports;
  objectDef(
    ObjectId.DRAGON_TAIL,
    "dragon",
    [],
    [
      enterBehavior("trigger-dragon-fire", "踩到龙尾触发喷火", (ctx) => {
        if (ctx.mode === "normal") ctx.api.fireDragon();
      }),
    ],
  );
}
