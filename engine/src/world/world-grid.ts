import type { Direction } from "../mechanics/ids.js";
import { DIRECTIONS } from "../mechanics/ids.js";
import type { DynamicEntity, Point } from "./RuntimeState.js";

export function emptyGrid<T>(width: number, height: number, value: T): T[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => value),
  );
}

export function copyPoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

export function statePoint(point: Point, x: number, y: number): boolean {
  return point.x === x && point.y === y;
}

export function isSameCell(entity: DynamicEntity, x: number, y: number): boolean {
  return entity.x === x && entity.y === y;
}

export function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    DIRECTIONS[a].dx === -DIRECTIONS[b].dx &&
    DIRECTIONS[a].dy === -DIRECTIONS[b].dy
  );
}
