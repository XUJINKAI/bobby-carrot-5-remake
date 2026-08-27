import type { Direction } from "@bobby/model";
import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { EntityInstance } from "../entity/EntityInstance.js";
import type { StackBand } from "./StackBand.js";

export interface FootprintPart {
  dx: number;
  dy: number;
  role?: string;
  stackBand?: StackBand;
  stackOrder?: number;
  traits?: readonly EntityTrait[];
}

export interface FootprintDefinition {
  parts: readonly FootprintPart[];
  /** 多格 Entity 是否随实例 direction 旋转。 */
  rotateWithDirection?: boolean;
  /** footprint 原始坐标所对应的朝向；默认 right。 */
  baseDirection?: Direction;
}

export const SINGLE_CELL_FOOTPRINT: FootprintDefinition = {
  parts: [{ dx: 0, dy: 0 }],
};

export function footprintCell(
  entity: Pick<EntityInstance, "anchor" | "direction">,
  footprint: FootprintDefinition,
  part: FootprintPart,
): { x: number; y: number } {
  const offset = footprintOffset(
    part.dx,
    part.dy,
    footprint.rotateWithDirection ? entity.direction : undefined,
    footprint.baseDirection ?? "right",
  );
  return { x: entity.anchor.x + offset.dx, y: entity.anchor.y + offset.dy };
}

export function footprintOffset(
  dx: number,
  dy: number,
  direction: Direction | undefined,
  baseDirection: Direction = "right",
): { dx: number; dy: number } {
  if (!direction || direction === baseDirection) return { dx, dy };
  const turns = (directionIndex(direction) - directionIndex(baseDirection) + 4) % 4;
  let x = dx;
  let y = dy;
  for (let turn = 0; turn < turns; turn += 1) [x, y] = [-y, x];
  return { dx: x, dy: y };
}

function directionIndex(direction: Direction): number {
  switch (direction) {
    case "right": return 0;
    case "down": return 1;
    case "left": return 2;
    case "up": return 3;
  }
}
