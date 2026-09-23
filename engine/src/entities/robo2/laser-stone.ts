import { MapEntityTypeId } from "@bobby/model";
import { ROBO2_GAMEPLAY_IMAGE_IDS } from "../../image/Robo2GameplayImages.js";
import { defineEntityModule, type EntityModule } from "../EntityModule.js";

export const laserStone: EntityModule = defineEntityModule({
  definition: {
    type: MapEntityTypeId.LASER_STONE,
    presenceFacts: ["blocking", "pushable"],
    presentation: { name: "Laser Stone" },
  },
  visual: {
    id: MapEntityTypeId.LASER_STONE,
    resolve: () => ({
      layers: [{
        kind: "image",
        asset: ROBO2_GAMEPLAY_IMAGE_IDS.stone,
        sourceTileSize: 12,
        anchor: "center",
      }],
    }),
  },
});
