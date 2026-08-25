import { objectLayoutFor, type ObjectType } from "@bobby/engine";
import type { EditorLevel, EditorObject } from "../level/types.js";

export interface Cell {
  x: number;
  y: number;
}

export interface OccupiedCell extends Cell {
  type: ObjectType;
}

export interface ResolvedObject {
  object: EditorObject;
  cells: OccupiedCell[];
  partType: ObjectType;
}

export function objectCells(object: EditorObject): OccupiedCell[] {
  return objectLayoutFor(object.type).cells.map((cell) => ({
    x: object.x + cell.dx,
    y: object.y + cell.dy,
    type: cell.type,
  }));
}

export function resolveObjectOwner(
  level: EditorLevel,
  x: number,
  y: number,
): ResolvedObject | null {
  for (const object of level.objects) {
    const cells = objectCells(object);
    const part = cells.find((cell) => cell.x === x && cell.y === y);
    if (part) return { object, cells, partType: part.type };
  }
  return null;
}

export function intersectingOwners(
  level: EditorLevel,
  cells: readonly Cell[],
): EditorObject[] {
  const targets = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
  return level.objects.filter((object) =>
    objectCells(object).some((cell) => targets.has(`${cell.x},${cell.y}`)),
  );
}
