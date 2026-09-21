import { MapEntityTypeId } from "@bobby/model";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";
import { crumblyRockVisual } from "../original/mower.js";

export const pushableStone: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.PUSHABLE_STONE,
    presenceFacts: ["blocking", "pushable"],
    presentation: {
      name: "Pushable Stone",
      visual: MapEntityTypeId.CRUMBLY_ROCK,
    },
  },
  visual: crumblyRockVisual,
});
