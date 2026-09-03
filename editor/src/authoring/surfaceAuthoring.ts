import type { EntityCatalog } from "@bobby/engine";
import { EntityTypeId, type EntityType, type LevelEntity } from "@bobby/model";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap } from "../level/types.js";
import type { Cell } from "./entityPlacement.js";
import { selectionRect } from "./selection.js";
import type { EditorSelection } from "../definitions/types.js";

export type SurfaceType = "ground" | "solid" | "water" | "ice" | "sky" | "waterfall";
export type SurfaceTheme = "forest" | "snow" | "desert" | "space" | "shared";
export type SurfacePattern = "auto" | "exact" | "alternate";
export type SurfaceTool = "brush" | "rect" | "fill" | "selection";

export interface SurfaceVariant {
  type: EntityType;
  label: string;
  weight?: number;
}

export interface SurfaceBrush {
  type: SurfaceType;
  theme: SurfaceTheme;
  pattern: SurfacePattern;
  exact?: EntityType;
  alternate?: readonly [EntityType, EntityType];
  seed: number;
}

export interface SurfaceGroup {
  type: SurfaceType;
  theme: SurfaceTheme;
  label: string;
  variants: readonly SurfaceVariant[];
}

function walkableVariant(number: number): EntityType {
  return `walkable-variant-${String(number).padStart(2, "0")}`;
}

function backgroundVariant(number: number): EntityType {
  return `background-variant-${String(number).padStart(3, "0")}`;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function variants(numbers: readonly number[], kind: "walkable" | "background"): SurfaceVariant[] {
  return numbers.map((number) => ({
    type: kind === "walkable" ? walkableVariant(number) : backgroundVariant(number),
    label: String(number),
  }));
}

const forestGround = variants([
  ...range(1, 3),
  ...range(17, 19),
  ...range(33, 35),
  ...range(49, 52),
  ...range(4, 8),
  ...range(20, 24),
  ...range(36, 39),
], "walkable");

const snowGround = variants([15, 16, 31, 32, 47], "walkable");
const desertGround = variants([48], "walkable");
const spaceGround = variants([
  ...range(9, 14),
  ...range(25, 30),
  39,
  40,
  ...range(41, 46),
], "walkable");

const forestSolid = variants([
  1,
  3,
  ...range(4, 8),
  ...range(20, 24),
  ...range(36, 40),
  54,
  ...range(11, 16),
  ...range(27, 32),
  ...range(43, 48),
  59,
  60,
  ...range(65, 71),
  ...range(81, 87),
], "background");

const snowSolid = variants([
  2,
  9,
  10,
  17,
  18,
  19,
  33,
  34,
  49,
  50,
  51,
  52,
], "background");
const desertSolid = variants([63, 64, 79, 80], "background");
const spaceSky = variants([72, 73, 74, 75, 76, 77], "background");

export const SURFACE_GROUPS: readonly SurfaceGroup[] = [
  { type: "ground", theme: "forest", label: "Forest Ground", variants: forestGround },
  { type: "ground", theme: "snow", label: "Snow Ground", variants: snowGround },
  { type: "ground", theme: "desert", label: "Desert Ground", variants: desertGround },
  { type: "ground", theme: "space", label: "Space Ground", variants: spaceGround },
  { type: "solid", theme: "forest", label: "Forest Solid", variants: forestSolid },
  { type: "solid", theme: "snow", label: "Snow Solid", variants: snowSolid },
  { type: "solid", theme: "desert", label: "Desert Solid", variants: desertSolid },
  { type: "sky", theme: "space", label: "Space Sky", variants: spaceSky },
  {
    type: "water",
    theme: "shared",
    label: "Water",
    variants: [
      { type: EntityTypeId.WATER, label: "Still" },
      { type: EntityTypeId.WATER_ANIMATED, label: "Animated", weight: 2 },
      { type: EntityTypeId.WATER_VARIANT_1, label: "Variant 1" },
      { type: EntityTypeId.WATER_VARIANT_2, label: "Variant 2" },
      { type: EntityTypeId.WATER_VARIANT_3, label: "Variant 3" },
    ],
  },
  {
    type: "ice",
    theme: "shared",
    label: "Ice",
    variants: [{ type: EntityTypeId.ICE, label: "Ice" }],
  },
  {
    type: "waterfall",
    theme: "shared",
    label: "Waterfall",
    variants: variants([92, 93, 94], "background").map((variant, index) => ({
      ...variant,
      label: ["Start", "Middle", "End"][index]!,
    })),
  },
];

const surfaceTypes = new Set(SURFACE_GROUPS.flatMap((group) => group.variants.map((variant) => variant.type)));
for (const type of [EntityTypeId.GROUND_A, EntityTypeId.GROUND_B, EntityTypeId.GROUND_C, EntityTypeId.GROUND_D]) {
  surfaceTypes.add(type);
}

export function isSurfaceEntityType(type: EntityType): boolean {
  return surfaceTypes.has(type);
}

export function surfaceGroup(type: SurfaceType, theme: SurfaceTheme): SurfaceGroup | null {
  return SURFACE_GROUPS.find((group) => group.type === type && group.theme === theme)
    ?? SURFACE_GROUPS.find((group) => group.type === type && group.theme === "shared")
    ?? null;
}

export function defaultSurfaceBrush(): SurfaceBrush {
  return { type: "ground", theme: "forest", pattern: "auto", seed: 1 };
}

export function paintSurface(
  catalog: EntityCatalog,
  cells: readonly Cell[],
  brush: SurfaceBrush,
): EditorCommand {
  return {
    apply(level) {
      if (cells.length === 0) return level;
      const target = new Set(cells.filter((cell) => inBounds(level, cell)).map(cellKey));
      if (target.size === 0) return level;
      const kept = level.entities.filter((entity) => !target.has(cellKey(entity)) || !isSurfaceEntityType(entity.type));
      const painted = [...target].map((key) => {
        const cell = parseCellKey(key);
        return createSurfaceEntity(catalog, brush, cell);
      }).filter((entity): entity is LevelEntity => entity !== null);
      return normalizeEditorLevel({ ...level, entities: [...kept, ...painted] });
    },
  };
}

export function fillSurface(
  catalog: EntityCatalog,
  level: Readonly<EditorMap>,
  origin: Cell,
  brush: SurfaceBrush,
): EditorCommand {
  const source = surfaceAt(level, origin);
  if (!source) return paintSurface(catalog, [origin], brush);
  const cells: Cell[] = [];
  const visited = new Set<string>();
  const queue: Cell[] = [origin];
  while (queue.length > 0) {
    const cell = queue.shift()!;
    const key = cellKey(cell);
    if (visited.has(key) || !inBounds(level, cell)) continue;
    visited.add(key);
    const entity = surfaceAt(level, cell);
    if (!entity || surfaceIdentity(entity.type) !== surfaceIdentity(source.type)) continue;
    cells.push(cell);
    queue.push(
      { x: cell.x - 1, y: cell.y },
      { x: cell.x + 1, y: cell.y },
      { x: cell.x, y: cell.y - 1 },
      { x: cell.x, y: cell.y + 1 },
    );
  }
  return paintSurface(catalog, cells, brush);
}

export function selectionCells(selection: EditorSelection): Cell[] {
  const rect = selectionRect(selection);
  const cells: Cell[] = [];
  for (let y = rect.top; y <= rect.bottom; y += 1) {
    for (let x = rect.left; x <= rect.right; x += 1) cells.push({ x, y });
  }
  return cells;
}

export function rectangleCells(anchor: Cell, focus: Cell): Cell[] {
  return selectionCells({ anchor, focus });
}

export function pickSurfaceBrush(level: Readonly<EditorMap>, cell: Cell): SurfaceBrush | null {
  const entity = surfaceAt(level, cell);
  if (!entity) return null;
  for (const group of SURFACE_GROUPS) {
    if (group.variants.some((variant) => variant.type === entity.type)) {
      return {
        type: group.type,
        theme: group.theme,
        pattern: "exact",
        exact: entity.type,
        seed: 1,
      };
    }
  }
  if ([EntityTypeId.GROUND_A, EntityTypeId.GROUND_B, EntityTypeId.GROUND_C, EntityTypeId.GROUND_D].includes(entity.type as never)) {
    return { type: "ground", theme: "forest", pattern: "exact", exact: entity.type, seed: 1 };
  }
  return null;
}

function createSurfaceEntity(catalog: EntityCatalog, brush: SurfaceBrush, cell: Cell): LevelEntity | null {
  const group = surfaceGroup(brush.type, brush.theme);
  if (!group || group.variants.length === 0) return null;
  let type: EntityType;
  if (brush.pattern === "exact" && brush.exact && group.variants.some((variant) => variant.type === brush.exact)) {
    type = brush.exact;
  } else if (brush.pattern === "alternate" && brush.alternate) {
    type = brush.alternate[(cell.x + cell.y) & 1];
  } else if (brush.type === "waterfall" && group.variants.length >= 3) {
    type = group.variants[1]!.type;
  } else {
    type = weightedVariant(group.variants, hashCell(cell, brush.seed));
  }
  catalog.require(type);
  return { type, x: cell.x, y: cell.y };
}

function weightedVariant(variants: readonly SurfaceVariant[], hash: number): EntityType {
  const total = variants.reduce((sum, variant) => sum + (variant.weight ?? 1), 0);
  let target = hash % total;
  for (const variant of variants) {
    target -= variant.weight ?? 1;
    if (target < 0) return variant.type;
  }
  return variants[0]!.type;
}

function hashCell(cell: Cell, seed: number): number {
  let value = Math.imul(cell.x + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(cell.y + seed, 0xc2b2ae35);
  value ^= value >>> 16;
  return value >>> 0;
}

function surfaceAt(level: Readonly<EditorMap>, cell: Cell): Readonly<LevelEntity> | null {
  return [...level.entities].reverse().find((entity) => entity.x === cell.x && entity.y === cell.y && isSurfaceEntityType(entity.type)) ?? null;
}

function surfaceIdentity(type: EntityType): string {
  for (const group of SURFACE_GROUPS) {
    if (group.variants.some((variant) => variant.type === type)) return `${group.type}:${group.theme}`;
  }
  if ([EntityTypeId.GROUND_A, EntityTypeId.GROUND_B, EntityTypeId.GROUND_C, EntityTypeId.GROUND_D].includes(type as never)) return "ground:forest";
  return type;
}

function inBounds(level: Readonly<EditorMap>, cell: Cell): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < level.width && cell.y < level.height;
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function parseCellKey(key: string): Cell {
  const [x, y] = key.split(",").map(Number);
  return { x: x!, y: y! };
}
