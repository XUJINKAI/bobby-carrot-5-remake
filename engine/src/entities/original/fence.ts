import { EntityTypeId } from "@bobby/model";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  CONTENT_STACK_ORDER,
  namedCell,
  originalModule,
} from "./module.js";

const definition: EntityModuleDefinition = {
  type: EntityTypeId.FENCE,
  authoring: { palette: false },
  traits: ["blocking", "fence"],
  stackOrder: CONTENT_STACK_ORDER,
  state: [
    {
      key: "variant",
      kind: "string",
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

/** 返回 ts.png 单格坐标；未指定 variant 时使用该邻接算法。 */
export function resolveFenceVariant(connections: FenceConnections): string {
  const { left, down, right, up } = connections;
  if (!left && down && !right) return "ts-16-11";
  if (left && !down && !right) return "ts-16-12";
  if (!left && down && right) return "ts-16-13";
  if (left && down && !right) return "ts-16-14";
  if (!left && !down && right) return "ts-16-15";
  if (up && !left && !right) return "ts-16-11";
  return "ts-16-10";
}

export const fence: EntityModule = originalModule(definition, {
  id: EntityTypeId.FENCE,
  resolve(context) {
    const fixed = context.entity.state?.variant;
    const variant =
      typeof fixed === "string" && /^ts-16-1[0-5]$/.test(fixed)
        ? fixed
        : resolveFenceVariant(resolveConnections(context));
    const atlas = namedCell(
      `fence-${Number(variant.slice("ts-16-".length)) - 9}`,
    );
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
