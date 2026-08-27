import { EntityTypeId, type Direction } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  clampProgress,
  contentDefinition,
  originalModule,
} from "./module.js";

const BOBBY_VISUAL_ASSETS: Readonly<Record<Direction, string>> = {
  left: "bobby-left",
  right: "bobby-right",
  up: "bobby-up",
  down: "bobby-down",
};

const definition = contentDefinition(EntityTypeId.BOBBY, "Bobby", ["player"], {
  occupancy: { group: "actor" },
  authoring: {
    palette: true,
    category: "角色",
    defaultDirection: "down",
  },
  presentation: { name: "Bobby", category: "角色" },
});

export const bobby: EntityModule = originalModule(definition, {
  id: EntityTypeId.BOBBY,
  resolve(context) {
    const direction = context.entity.direction ?? "down";
    return {
      layers: [
        {
          kind: "image",
          asset: BOBBY_VISUAL_ASSETS[direction],
          frameWidth: 48,
          frameProgress: context.runtime?.moving
            ? clampProgress(context.runtime.progress ?? 0)
            : 0,
          anchor: "bottom",
        },
      ],
    };
  },
});
