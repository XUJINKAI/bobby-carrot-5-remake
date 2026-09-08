import type { Direction } from "@bobby/model";
import type { EntityTrait } from "../entity/EntityDefinition.js";
import type { CellPosition } from "../entity/EntityInstance.js";

export interface FootprintPart {
  dx: number;
  dy: number;
  role?: string;
  stackOrder?: number;
  traits?: readonly EntityTrait[];
}

export interface FixedFootprint {
  parts: readonly FootprintPart[];
}

export interface DirectionalFootprint {
  byDirection: Partial<Record<Direction, readonly FootprintPart[]>>;
}

export type FootprintDefinition = FixedFootprint | DirectionalFootprint;

export interface FootprintEntity {
  anchor: CellPosition;
  direction?: Direction;
}

export interface ResolvedFootprintCell extends CellPosition {
  role?: string;
  stackOrder?: number;
  traits?: readonly EntityTrait[];
}

export const SINGLE_CELL_FOOTPRINT: FixedFootprint = {
  parts: [{ dx: 0, dy: 0 }],
};

export function resolveFootprintCells(
  entity: FootprintEntity,
  footprint: FootprintDefinition = SINGLE_CELL_FOOTPRINT,
): readonly ResolvedFootprintCell[] {
  return footprintParts(entity, footprint).map((part) => {
    const cell = footprintCell(entity, footprint, part);
    return {
      ...cell,
      ...(part.role ? { role: part.role } : {}),
      ...(part.stackOrder !== undefined ? { stackOrder: part.stackOrder } : {}),
      ...(part.traits ? { traits: part.traits } : {}),
    };
  });
}

export function footprintCell(
  entity: FootprintEntity,
  _footprint: FootprintDefinition,
  part: FootprintPart,
): CellPosition {
  const offset = footprintOffset(part.dx, part.dy);
  return { x: entity.anchor.x + offset.dx, y: entity.anchor.y + offset.dy };
}

export function footprintOffset(
  dx: number,
  dy: number,
): { dx: number; dy: number } {
  return { dx, dy };
}

function footprintParts(
  entity: FootprintEntity,
  footprint: FootprintDefinition,
): readonly FootprintPart[] {
  if ("parts" in footprint) return footprint.parts;
  if (!entity.direction)
    throw new Error("Directional footprint requires entity direction");
  const parts = footprint.byDirection[entity.direction];
  if (!parts)
    throw new Error(
      `Directional footprint does not define direction: ${entity.direction}`,
    );
  return parts;
}
