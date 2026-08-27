import { EntityTypeId } from "@bobby/model";
import type { EntityDefinition } from "../../world/entity/EntityDefinition.js";

export const customEntityDefinitions: readonly EntityDefinition[] = [
  {
    type: EntityTypeId.PUSH_GOAL,
    traits: ["walkable", "push-goal"],
    stackBand: "surface",
    occupancy: { group: "surface", replaceSameGroup: true },
    presentation: { name: "Push Goal", category: "目标" },
    authoring: { palette: true, category: "目标" },
  },
  {
    type: EntityTypeId.PORTAL,
    traits: ["portal"],
    stackBand: "content",
    properties: [
      {
        key: "channel",
        kind: "enum",
        label: "频道",
        default: "blue",
        options: [
          { value: "blue", label: "蓝色" },
          { value: "red", label: "红色" },
          { value: "green", label: "绿色" },
        ],
      },
    ],
    presentation: { name: "Portal", category: "机关" },
    authoring: { palette: true, category: "机关" },
  },
];
