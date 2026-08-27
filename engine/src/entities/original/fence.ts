import { EntityTypeId } from "@bobby/model";
import type { EntityModule } from "../EntityModule.js";
import {
  contentDefinition,
  objectCell,
  originalModule,
} from "./module.js";

const definition = contentDefinition(
  EntityTypeId.FENCE,
  "Fence",
  ["blocking", "fence"],
  {
    presentation: { name: "Fence", category: "障碍" },
    authoring: { palette: true, category: "障碍" },
  },
);

export const fence: EntityModule = originalModule(definition, {
  id: EntityTypeId.FENCE,
  resolve(context) {
    const { x, y } = context.presence.cell;
    const connectedAt = (dx: number, dy: number): boolean => {
      const target = { x: x + dx, y: y + dy };
      if (!context.query.inBounds(target)) return true;
      return context.query.presencesAt(target).some(
        (presence) =>
          presence.traits.includes("fence") ||
          presence.traits.includes("gate"),
      );
    };

    const left = connectedAt(-1, 0);
    const down = connectedAt(0, 1);
    const right = connectedAt(1, 0);
    const up = connectedAt(0, -1);

    let artIndex = 48;
    if (!left && down && !right) artIndex = 49;
    else if (left && !down && !right) artIndex = 50;
    else if (!left && down && right) artIndex = 51;
    else if (left && down && !right) artIndex = 52;
    else if (!left && !down && right) artIndex = 53;
    else if (up && !left && !right) artIndex = 49;

    const atlas = objectCell(artIndex);
    return {
      layers: [
        {
          kind: "atlas",
          column: atlas.column,
          row: atlas.row,
        },
      ],
    };
  },
});
