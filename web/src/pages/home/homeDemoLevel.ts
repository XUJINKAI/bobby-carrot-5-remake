import {
  applyLevelPatches,
  MapEntityTypeId,
  type LevelMap,
  type LevelPatch,
} from "@bobby/model";
import { webT, webTArray } from "../../i18n/webI18n.js";

function homeDemoPatches(): readonly LevelPatch[] {
  return [
    {
      operation: "set-fields",
      selector: { type: MapEntityTypeId.SANDMAN, x: 6, y: 6 },
      fields: { dialogue: webTArray("home.dialogue.sandman") },
    },
    {
      operation: "set-fields",
      selector: { type: MapEntityTypeId.SNOWMAN, x: 10, y: 6 },
      fields: { dialogue: webTArray("home.dialogue.snowman") },
    },
    {
      operation: "set-fields",
      selector: { type: MapEntityTypeId.SNOWMAN, x: 4, y: 1 },
      fields: { dialogue: webT("home.dialogue.snowmanUpper") },
    },
    {
      operation: "add",
      entity: {
        type: MapEntityTypeId.PORTAL,
        x: 11,
        y: 5,
        channel: "home-demo",
        color: "#ce36df",
      },
    },
    {
      operation: "add",
      entity: {
        type: MapEntityTypeId.PORTAL,
        x: 5,
        y: 2,
        channel: "home-demo",
        color: "#ce36df",
      },
    },
    {
      operation: "add",
      entity: { type: MapEntityTypeId.PUSHABLE_BOX, x: 7, y: 11 },
    },
    {
      operation: "add",
      entity: { type: MapEntityTypeId.PUSHABLE_BOX, x: 8, y: 11 },
    },
  ];
}

export function createHomeDemoLevel(level: LevelMap): LevelMap {
  return applyLevelPatches(level, homeDemoPatches());
}
