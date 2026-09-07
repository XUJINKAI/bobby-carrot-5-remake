import catalog from "./ts-visuals.json" with { type: "json" };
import type { JsonPrimitive } from "../../shared/json.js";

export interface TsCoordinate {
  row: number;
  column: number;
}

export interface TsVisualDefinition extends TsCoordinate {
  id: string;
  label: string;
  name: string;
}

export interface TsAtlasCellDefinition extends TsCoordinate {
  name: string;
  label: string;
}

export interface TsSurfaceCellDefinition extends TsCoordinate {
  fields?: Readonly<Record<string, JsonPrimitive>>;
  frame?: string;
  name?: string;
  label?: string;
}

export interface TsSurfaceFamilyDefinition {
  type: string;
  label: string;
  coordinateVariant: boolean;
  cells: readonly TsSurfaceCellDefinition[];
}

type RawSurfaceCell = string | {
  cell: string;
  fields?: Record<string, JsonPrimitive>;
  frame?: string;
  name?: string;
  label?: string;
};

type RawSurfaceFamily = {
  type: string;
  label: string;
  coordinateVariant?: boolean;
  cells: RawSurfaceCell[];
};

const rawCatalog = catalog as {
  schemaVersion: number;
  atlas: string;
  surfaceFamilies: RawSurfaceFamily[];
  visuals: Record<string, { cell: string; label: string; name: string }>;
};

if (rawCatalog.schemaVersion !== 1 || rawCatalog.atlas !== "ts.png")
  throw new Error("ts visual 命名表的 schemaVersion 或 atlas 不受支持");

export const TS_SURFACE_FAMILIES: readonly TsSurfaceFamilyDefinition[] =
  Object.freeze(rawCatalog.surfaceFamilies.map((family) => Object.freeze({
    type: family.type,
    label: family.label,
    coordinateVariant: family.coordinateVariant === true,
    cells: Object.freeze(family.cells.map((cell) => {
      const entry = typeof cell === "string" ? { cell } : cell;
      return Object.freeze({
        ...parseTsCell(entry.cell),
        ...(entry.fields ? { fields: Object.freeze({ ...entry.fields }) } : {}),
        ...(entry.frame ? { frame: entry.frame } : {}),
        ...(entry.name ? { name: entry.name } : {}),
        ...(entry.label ? { label: entry.label } : {}),
      });
    })),
  })));

const surfaceFrames = TS_SURFACE_FAMILIES.flatMap((family) =>
  family.cells.flatMap((cell) => cell.frame
    ? [[cell.frame, Object.freeze({
        id: cell.frame,
        label: cell.label ?? family.label,
        name: cell.name ?? family.type,
        row: cell.row,
        column: cell.column,
      })] as const]
    : []),
);

export const TS_VISUALS: Readonly<Record<string, TsVisualDefinition>> =
  Object.freeze(Object.fromEntries([
    ...surfaceFrames,
    ...Object.entries(rawCatalog.visuals).map(([id, visual]) => [
      id,
      Object.freeze({
        id,
        label: visual.label,
        name: visual.name,
        ...parseTsCell(visual.cell),
      }),
    ] as const),
  ]));

const atlasCells = new Map<string, TsAtlasCellDefinition>();
for (const family of TS_SURFACE_FAMILIES) {
  for (const cell of family.cells) {
    atlasCells.set(tsCoordinateLabel(cell), Object.freeze({
      row: cell.row,
      column: cell.column,
      name: cell.name ?? family.type,
      label: cell.label ?? family.label,
    }));
  }
}
for (const visual of Object.values(TS_VISUALS)) {
  atlasCells.set(tsCoordinateLabel(visual), Object.freeze({
    row: visual.row,
    column: visual.column,
    name: visual.name,
    label: visual.label,
  }));
}

export function tsSurfaceFamily(type: string): TsSurfaceFamilyDefinition {
  const family = TS_SURFACE_FAMILIES.find((candidate) => candidate.type === type);
  if (!family) throw new Error(`ts visual 命名表缺少 Surface family：${type}`);
  return family;
}

export function tsAtlasCell(row: number, column: number): TsAtlasCellDefinition {
  const cell = atlasCells.get(tsCoordinateLabel({ row, column }));
  if (!cell) throw new Error(`ts visual 命名表缺少 ${row}-${column}`);
  return cell;
}

export function tsVisual(id: string): TsVisualDefinition {
  const visual = TS_VISUALS[id];
  if (!visual) throw new Error(`ts visual 命名表缺少 ${id}`);
  return visual;
}

export function tsCoordinateLabel(source: TsCoordinate): string {
  return `ts-${source.row}-${source.column}`;
}

export function parseTsCoordinateLabel(value: string): TsCoordinate | undefined {
  const match = /^ts-(\d+)-(\d+)$/.exec(value);
  if (!match) return undefined;
  const coordinate = { row: Number(match[1]), column: Number(match[2]) };
  return isTsCoordinate(coordinate.row, coordinate.column)
    ? coordinate
    : undefined;
}

export function isTsCoordinate(row: number, column: number): boolean {
  return Number.isInteger(row) && Number.isInteger(column) &&
    row >= 1 && row <= 16 && column >= 1 && column <= 16;
}

function parseTsCell(value: string): TsCoordinate {
  const match = /^(\d+)-(\d+)$/.exec(value);
  const row = Number(match?.[1]);
  const column = Number(match?.[2]);
  if (!match || !isTsCoordinate(row, column))
    throw new Error(`ts visual 命名表坐标无效：${value}`);
  return { row, column };
}
