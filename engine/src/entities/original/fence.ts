import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  CONTENT_STACK_ORDER,
  objectCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.FENCE,
  traits: ["blocking", "fence"],
  stackOrder: CONTENT_STACK_ORDER,
  state: [
    {
      key: "variant",
      kind: "number",
      label: "Visual variant",
    },
  ],
  presentation: { name: "Fence" },
};

export interface FenceConnections {
  left: boolean;
  down: boolean;
  right: boolean;
  up: boolean;
}

/** 1..6 对应 ts.png 16,10--16,15；未指定 variant 时使用该邻接算法。 */
export function resolveFenceVariant(connections: FenceConnections): number {
  const { left, down, right, up } = connections;
  if (!left && down && !right) return 2;
  if (left && !down && !right) return 3;
  if (!left && down && right) return 4;
  if (left && down && !right) return 5;
  if (!left && !down && right) return 6;
  if (up && !left && !right) return 2;
  return 1;
}

export const fence: EntityModule = originalModule(definition, {
  id: EntityTypeId.FENCE,
  resolve(context) {
    const fixed = Number(context.entity.state?.variant);
    const variant =
      Number.isInteger(fixed) && fixed >= 1 && fixed <= 6
        ? fixed
        : resolveFenceVariant(resolveConnections(context));
    const atlas = objectCell(47 + variant);
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

function resolveConnections(context: Parameters<typeof fenceVisualContext>[0]): FenceConnections {
  return fenceVisualContext(context);
}

function fenceVisualContext(context: {
  presence: { cell: { x: number; y: number } };
  query: {
    inBounds(cell: { x: number; y: number }): boolean;
    presencesAt(cell: { x: number; y: number }): readonly { traits: readonly string[] }[];
  };
}): FenceConnections {
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
  return {
    left: connectedAt(-1, 0),
    down: connectedAt(0, 1),
    right: connectedAt(1, 0),
    up: connectedAt(0, -1),
  };
}
