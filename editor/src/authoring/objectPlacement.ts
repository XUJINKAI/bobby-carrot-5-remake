import { objectLayoutFor, type ObjectType } from "@bobby/engine";
import type { EditorLevel } from "../level/types.js";
import type { Cell, OccupiedCell } from "./objectOwners.js";

export function anchorForCursor(type: ObjectType, cell: Cell): Cell {
  const cursor = objectLayoutFor(type).cursor;
  return { x: cell.x - cursor.dx, y: cell.y - cursor.dy };
}

export function placementCells(
  type: ObjectType,
  cell: Cell,
): OccupiedCell[] {
  const anchor = anchorForCursor(type, cell);
  return objectLayoutFor(type).cells.map((part) => ({
    x: anchor.x + part.dx,
    y: anchor.y + part.dy,
    type: part.type,
  }));
}

export function placementFits(
  level: EditorLevel,
  type: ObjectType,
  cell: Cell,
): boolean {
  return placementCells(type, cell).every(
    (part) =>
      part.x >= 0 &&
      part.y >= 0 &&
      part.x < level.width &&
      part.y < level.height,
  );
}
