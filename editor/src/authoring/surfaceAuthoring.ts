import type { EntityCatalog } from "@bobby/engine";
import { EntityTypeId, type EntityType, type LevelEntity } from "@bobby/model";
import type { EditorCommand } from "../document/commands.js";
import { normalizeEditorLevel } from "../level/editorLevel.js";
import type { EditorMap } from "../level/types.js";
import type { Cell } from "./entityPlacement.js";

export type SurfaceType =
  | "ground"
  | "solid"
  | "water"
  | "ice"
  | "sky"
  | "waterfall";
export type SurfaceTheme = "mixed" | "forest" | "snow" | "desert" | "space";
export type SurfacePattern = "auto" | "exact" | "alternate";
export type SurfaceTool = "brush" | "rect" | "fill";
export type SurfaceTerrainId =
  | "grass"
  | "grass-water-edge"
  | "snow-ground"
  | "sand"
  | "cloud"
  | "ice"
  | "water"
  | "waterfall"
  | "sky"
  | "moon"
  | "stump"
  | "flower-pot"
  | "stone"
  | "stone-wall"
  | "tree"
  | "fence"
  | "snow-rock"
  | "christmas-tree"
  | "snow-fence"
  | "christmas-tent"
  | "snowman"
  | "cactus";

type ConcreteSurfaceTheme = Exclude<SurfaceTheme, "mixed">;

export interface SurfaceVariant {
  type: EntityType;
  label: string;
  weight?: number;
}

export interface SurfaceBrush {
  terrain: SurfaceTerrainId;
  pattern: SurfacePattern;
  exact?: EntityType;
  alternate?: readonly [EntityType, EntityType];
  seed: number;
}

export interface SurfaceTerrainDefinition {
  id: SurfaceTerrainId;
  label: string;
  type: SurfaceType;
  primary: EntityType;
  /** Explicit authoring layout. Rows are preserved by the Surface UI. */
  rows: readonly (readonly SurfaceVariant[])[];
  theme?: ConcreteSurfaceTheme;
  /** Theme switches only swap terrains within the same family and SurfaceType. */
  themeFamily?: string;
}

export interface SurfaceTerrainGroup {
  id: string;
  label: string;
  rows: readonly (readonly SurfaceTerrainId[])[];
}

export interface SurfaceThemeDefinition {
  id: SurfaceTheme;
  label: string;
  preview: readonly EntityType[];
}

function walkableVariant(number: number): EntityType {
  return `walkable-variant-${String(number).padStart(2, "0")}`;
}

function backgroundVariant(number: number): EntityType {
  return `background-variant-${String(number).padStart(3, "0")}`;
}

function variant(number: number, kind: "walkable" | "background"): SurfaceVariant {
  return {
    type: kind === "walkable" ? walkableVariant(number) : backgroundVariant(number),
    label: String(number),
  };
}

function variantRow(
  numbers: readonly number[],
  kind: "walkable" | "background",
): SurfaceVariant[] {
  return numbers.map((number) => variant(number, kind));
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function terrain(
  definition: Omit<SurfaceTerrainDefinition, "primary"> & { primary?: EntityType },
): SurfaceTerrainDefinition {
  const first = definition.rows.flat()[0]?.type;
  if (!definition.primary && !first)
    throw new Error(`Surface terrain ${definition.id} has no variants`);
  return {
    ...definition,
    primary: definition.primary ?? first!,
  };
}

// docs/system/original/surface.md 使用 1-based ts 行列坐标。
const grass = terrain({
  id: "grass",
  label: "草地",
  type: "ground",
  theme: "forest",
  themeFamily: "base-ground",
  rows: [
    variantRow(range(1, 3), "walkable"),
    variantRow(range(17, 19), "walkable"),
    variantRow(range(33, 35), "walkable"),
    variantRow(range(49, 52), "walkable"),
  ],
});
const grassWaterEdge = terrain({
  id: "grass-water-edge",
  label: "水边草地",
  type: "ground",
  theme: "forest",
  rows: [
    variantRow(range(4, 8), "walkable"),
    variantRow(range(20, 24), "walkable"),
    variantRow(range(36, 39), "walkable"),
  ],
});
const snowGround = terrain({
  id: "snow-ground",
  label: "雪地",
  type: "ground",
  theme: "snow",
  themeFamily: "base-ground",
  rows: [variantRow([15, 16], "walkable"), variantRow([31, 32, 47], "walkable")],
});
const sand = terrain({
  id: "sand",
  label: "沙地",
  type: "ground",
  theme: "desert",
  themeFamily: "base-ground",
  rows: [variantRow([48], "walkable")],
});
const cloud = terrain({
  id: "cloud",
  label: "云层",
  type: "ground",
  theme: "space",
  themeFamily: "base-ground",
  rows: [
    variantRow(range(9, 14), "walkable"),
    variantRow(range(25, 30), "walkable"),
    variantRow([39, 40, ...range(41, 46)], "walkable"),
  ],
});
const ice = terrain({
  id: "ice",
  label: "冰面",
  type: "ice",
  theme: "snow",
  rows: [[{ type: EntityTypeId.ICE, label: "Ice" }]],
});
const water = terrain({
  id: "water",
  label: "水",
  type: "water",
  primary: EntityTypeId.WATER_ANIMATED,
  rows: [[
    { type: EntityTypeId.WATER, label: "Still" },
    { type: EntityTypeId.WATER_ANIMATED, label: "Animated", weight: 2 },
    { type: EntityTypeId.WATER_VARIANT_1, label: "Variant 1" },
    { type: EntityTypeId.WATER_VARIANT_2, label: "Variant 2" },
    { type: EntityTypeId.WATER_VARIANT_3, label: "Variant 3" },
  ]],
});
const waterfall = terrain({
  id: "waterfall",
  label: "瀑布",
  type: "waterfall",
  primary: backgroundVariant(93),
  rows: [[
    { type: backgroundVariant(92), label: "Start" },
    { type: backgroundVariant(93), label: "Middle" },
    { type: backgroundVariant(94), label: "End" },
  ]],
});
const sky = terrain({
  id: "sky",
  label: "天空",
  type: "sky",
  theme: "space",
  primary: backgroundVariant(74),
  rows: [variantRow([72, 73, 74], "background")],
});
const moon = terrain({
  id: "moon",
  label: "月亮",
  type: "sky",
  theme: "space",
  rows: [variantRow([75, 76, 77], "background")],
});
const stump = terrain({
  id: "stump",
  label: "木桩",
  type: "solid",
  theme: "forest",
  rows: [variantRow([1], "background")],
});
const flowerPot = terrain({
  id: "flower-pot",
  label: "花盆",
  type: "solid",
  theme: "forest",
  rows: [variantRow([3], "background")],
});
const stone = terrain({
  id: "stone",
  label: "石头",
  type: "solid",
  theme: "forest",
  themeFamily: "rock",
  rows: [variantRow([54], "background")],
});
const stoneWall = terrain({
  id: "stone-wall",
  label: "墙",
  type: "solid",
  theme: "forest",
  rows: [
    variantRow(range(4, 8), "background"),
    variantRow(range(20, 24), "background"),
    variantRow(range(36, 40), "background"),
    variantRow(range(55, 58), "background"),
  ],
});
const tree = terrain({
  id: "tree",
  label: "树",
  type: "solid",
  theme: "forest",
  themeFamily: "vegetation",
  rows: [
    variantRow(range(11, 16), "background"),
    variantRow(range(27, 32), "background"),
    variantRow(range(43, 48), "background"),
    variantRow([59, 60], "background"),
  ],
});
const fence = terrain({
  id: "fence",
  label: "篱笆",
  type: "solid",
  theme: "forest",
  themeFamily: "fence",
  rows: [
    variantRow(range(65, 71), "background"),
    variantRow(range(81, 85), "background"),
    variantRow([52, 53], "background"),
  ],
});
const snowRock = terrain({
  id: "snow-rock",
  label: "带雪的石头",
  type: "solid",
  theme: "snow",
  themeFamily: "rock",
  rows: [variantRow([2], "background")],
});
const christmasTree = terrain({
  id: "christmas-tree",
  label: "圣诞树",
  type: "solid",
  theme: "snow",
  themeFamily: "vegetation",
  rows: [variantRow([9, 10], "background"), variantRow([25, 26], "background"), variantRow([41, 42], "background")],
});
const snowFence = terrain({
  id: "snow-fence",
  label: "带雪的篱笆",
  type: "solid",
  theme: "snow",
  themeFamily: "fence",
  rows: [variantRow([17, 18, 19], "background"), variantRow([33, 49], "background")],
});
const christmasTent = terrain({
  id: "christmas-tent",
  label: "圣诞帐篷",
  type: "solid",
  theme: "snow",
  rows: [variantRow([34, 50], "background")],
});
const snowman = terrain({
  id: "snowman",
  label: "雪人",
  type: "solid",
  theme: "snow",
  rows: [variantRow([35, 51], "background")],
});
const cactus = terrain({
  id: "cactus",
  label: "仙人掌",
  type: "solid",
  theme: "desert",
  themeFamily: "vegetation",
  rows: [variantRow([63, 64], "background"), variantRow([79, 80], "background")],
});

export const SURFACE_TERRAINS: readonly SurfaceTerrainDefinition[] = [
  grass,
  grassWaterEdge,
  snowGround,
  sand,
  cloud,
  ice,
  water,
  waterfall,
  sky,
  moon,
  stump,
  flowerPot,
  stone,
  stoneWall,
  tree,
  fence,
  snowRock,
  christmasTree,
  snowFence,
  christmasTent,
  snowman,
  cactus,
];

export const SURFACE_TERRAIN_GROUPS: readonly SurfaceTerrainGroup[] = [
  {
    id: "ground",
    label: "Ground",
    rows: [
      ["grass", "grass-water-edge", "snow-ground", "sand"],
      ["cloud", "ice", "water", "waterfall"],
    ],
  },
  {
    id: "solid",
    label: "Solid",
    rows: [
      ["stone", "stone-wall", "fence", "snow-fence"],
      ["tree", "christmas-tree", "cactus", "stump"],
      ["snow-rock", "flower-pot", "christmas-tent", "snowman"],
    ],
  },
  { id: "environment", label: "Environment", rows: [["sky", "moon"]] },
];

export const SURFACE_THEMES: readonly SurfaceThemeDefinition[] = [
  {
    id: "mixed",
    label: "混合",
    preview: [grass.primary, snowGround.primary, sand.primary, sky.primary],
  },
  {
    id: "forest",
    label: "森林",
    preview: [grass.primary, tree.primary, fence.primary, stone.primary],
  },
  {
    id: "snow",
    label: "雪地",
    preview: [snowGround.primary, snowFence.primary, christmasTree.primary, snowRock.primary],
  },
  {
    id: "desert",
    label: "沙地",
    preview: [sand.primary, cactus.primary, cactus.rows.flat()[2]!.type, stone.primary],
  },
  {
    id: "space",
    label: "太空",
    preview: [cloud.primary, sky.rows.flat()[0]!.type, sky.primary, moon.primary],
  },
];

const LEGACY_GROUND_TYPES = new Set<EntityType>([
  EntityTypeId.GROUND_A,
  EntityTypeId.GROUND_B,
  EntityTypeId.GROUND_C,
  EntityTypeId.GROUND_D,
]);
const surfaceTypes = new Set<EntityType>(
  SURFACE_TERRAINS.flatMap((item) => item.rows.flat().map((item) => item.type)),
);
for (const type of LEGACY_GROUND_TYPES) surfaceTypes.add(type);

export function isSurfaceEntityType(type: EntityType): boolean {
  return surfaceTypes.has(type);
}

export function surfaceTerrain(id: SurfaceTerrainId): SurfaceTerrainDefinition {
  const result = SURFACE_TERRAINS.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`Unknown Surface terrain: ${id}`);
  return result;
}

export function surfaceTerrainForEntity(
  type: EntityType,
): SurfaceTerrainDefinition | null {
  if (LEGACY_GROUND_TYPES.has(type)) return grass;
  return (
    SURFACE_TERRAINS.find((item) =>
      item.rows.flat().some((variant) => variant.type === type),
    ) ?? null
  );
}

export function defaultSurfaceBrush(): SurfaceBrush {
  return { terrain: "grass", pattern: "auto", seed: 1 };
}

export function detectSurfaceTheme(level: Readonly<EditorMap>): SurfaceTheme {
  const themes = new Set<ConcreteSurfaceTheme>();
  for (const entity of level.entities) {
    const item = surfaceTerrainForEntity(entity.type);
    if (item?.themeFamily && item.theme) themes.add(item.theme);
    if (themes.size > 1) return "mixed";
  }
  return themes.values().next().value ?? "mixed";
}

export function applySurfaceTheme(
  catalog: EntityCatalog,
  theme: SurfaceTheme,
): EditorCommand {
  return {
    apply(level) {
      if (theme === "mixed") return level;
      let changed = false;
      const entities = level.entities.map((entity) => {
        const source = surfaceTerrainForEntity(entity.type);
        if (!source?.themeFamily || source.theme === theme) return entity;
        const target = SURFACE_TERRAINS.find(
          (candidate) =>
            candidate.themeFamily === source.themeFamily &&
            candidate.theme === theme &&
            candidate.type === source.type,
        );
        if (!target) return entity;
        const type = weightedVariant(
          target.rows.flat(),
          hashCell({ x: entity.x, y: entity.y }, 1),
        );
        catalog.require(type);
        if (type === entity.type) return entity;
        changed = true;
        return { ...entity, type };
      });
      return changed ? normalizeEditorLevel({ ...level, entities }) : level;
    },
  };
}

export function paintSurface(
  catalog: EntityCatalog,
  cells: readonly Cell[],
  brush: SurfaceBrush,
): EditorCommand {
  return {
    apply(level) {
      const target = new Set(
        cells.filter((cell) => inBounds(level, cell)).map(cellKey),
      );
      if (target.size === 0) return level;
      const kept = level.entities.filter(
        (entity) =>
          !target.has(cellKey(entity)) || !isSurfaceEntityType(entity.type),
      );
      const painted = [...target]
        .map((key) => createSurfaceEntity(catalog, brush, parseCellKey(key), target))
        .filter((entity): entity is LevelEntity => entity !== null);
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
  const sourceTerrain = source ? surfaceTerrainForEntity(source.type) : null;
  if (!sourceTerrain) return paintSurface(catalog, [origin], brush);
  const cells: Cell[] = [];
  const visited = new Set<string>();
  const queue: Cell[] = [origin];
  while (queue.length > 0) {
    const cell = queue.shift()!;
    const key = cellKey(cell);
    if (visited.has(key) || !inBounds(level, cell)) continue;
    visited.add(key);
    const entity = surfaceAt(level, cell);
    const item = entity ? surfaceTerrainForEntity(entity.type) : null;
    if (!item || item.id !== sourceTerrain.id) continue;
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

export function rectangleCells(anchor: Cell, focus: Cell): Cell[] {
  const left = Math.min(anchor.x, focus.x);
  const right = Math.max(anchor.x, focus.x);
  const top = Math.min(anchor.y, focus.y);
  const bottom = Math.max(anchor.y, focus.y);
  const cells: Cell[] = [];
  for (let y = top; y <= bottom; y += 1)
    for (let x = left; x <= right; x += 1) cells.push({ x, y });
  return cells;
}

export function pickSurfaceBrush(
  level: Readonly<EditorMap>,
  cell: Cell,
): SurfaceBrush | null {
  const entity = surfaceAt(level, cell);
  if (!entity) return null;
  const item = surfaceTerrainForEntity(entity.type);
  if (!item) return null;
  return {
    terrain: item.id,
    pattern: "exact",
    exact: entity.type,
    seed: 1,
  };
}

function createSurfaceEntity(
  catalog: EntityCatalog,
  brush: SurfaceBrush,
  cell: Cell,
  target: ReadonlySet<string>,
): LevelEntity | null {
  const item = surfaceTerrain(brush.terrain);
  const variants = item.rows.flat();
  if (variants.length === 0) return null;
  let type: EntityType;
  if (
    brush.pattern === "exact" &&
    brush.exact &&
    variants.some((variant) => variant.type === brush.exact)
  ) {
    type = brush.exact;
  } else if (
    brush.pattern === "alternate" &&
    brush.alternate &&
    brush.alternate.every((candidate) =>
      variants.some((variant) => variant.type === candidate),
    )
  ) {
    type = brush.alternate[(cell.x + cell.y) & 1]!;
  } else if (item.type === "waterfall" && variants.length >= 3) {
    const above = target.has(cellKey({ x: cell.x, y: cell.y - 1 }));
    const below = target.has(cellKey({ x: cell.x, y: cell.y + 1 }));
    type = !above
      ? variants[0]!.type
      : !below
        ? variants[2]!.type
        : variants[1]!.type;
  } else {
    type = weightedVariant(variants, hashCell(cell, brush.seed));
  }
  catalog.require(type);
  return { type, x: cell.x, y: cell.y };
}

function weightedVariant(
  variants: readonly SurfaceVariant[],
  hash: number,
): EntityType {
  const total = variants.reduce(
    (sum, item) => sum + (item.weight ?? 1),
    0,
  );
  let target = hash % total;
  for (const item of variants) {
    target -= item.weight ?? 1;
    if (target < 0) return item.type;
  }
  return variants[0]!.type;
}

function hashCell(cell: Cell, seed: number): number {
  let value =
    Math.imul(cell.x + 0x9e3779b9, 0x85ebca6b) ^
    Math.imul(cell.y + seed, 0xc2b2ae35);
  value ^= value >>> 16;
  return value >>> 0;
}

function surfaceAt(
  level: Readonly<EditorMap>,
  cell: Cell,
): Readonly<LevelEntity> | null {
  return (
    [...level.entities]
      .reverse()
      .find(
        (entity) =>
          entity.x === cell.x &&
          entity.y === cell.y &&
          isSurfaceEntityType(entity.type),
      ) ?? null
  );
}

function inBounds(level: Readonly<EditorMap>, cell: Cell): boolean {
  return (
    cell.x >= 0 &&
    cell.y >= 0 &&
    cell.x < level.width &&
    cell.y < level.height
  );
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function parseCellKey(key: string): Cell {
  const [x, y] = key.split(",").map(Number);
  return { x: x!, y: y! };
}
