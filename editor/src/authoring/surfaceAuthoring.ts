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
  variants: readonly SurfaceVariant[];
  theme?: ConcreteSurfaceTheme;
  /** Same-family terrain may be swapped by a visual Theme without changing SurfaceType. */
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

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function variants(
  numbers: readonly number[],
  kind: "walkable" | "background",
): SurfaceVariant[] {
  return numbers.map((number) => ({
    type:
      kind === "walkable"
        ? walkableVariant(number)
        : backgroundVariant(number),
    label: String(number),
  }));
}

// docs/system/original/surface.md 使用 1-based 的 ts 行列坐标；walkable variant
// 从 ts 第 7 行开始编号，background variant 则覆盖完整 16×16 ts。
const grassVariants = variants(
  [
    ...range(1, 3),
    ...range(17, 19),
    ...range(33, 35),
    ...range(49, 52),
  ],
  "walkable",
);
const grassWaterEdgeVariants = variants(
  [
    ...range(4, 8),
    ...range(20, 24),
    ...range(36, 39),
  ],
  "walkable",
);
const snowGroundVariants = variants([15, 16, 31, 32, 47], "walkable");
const sandVariants = variants([48], "walkable");
const cloudVariants = variants(
  [
    ...range(9, 14),
    ...range(25, 30),
    39,
    40,
    ...range(41, 46),
  ],
  "walkable",
);

const stumpVariants = variants([1], "background");
const snowRockVariants = variants([2], "background");
const flowerPotVariants = variants([3], "background");
const stoneWallVariants = variants(
  [
    ...range(4, 8),
    ...range(20, 24),
    ...range(36, 40),
    ...range(55, 58),
  ],
  "background",
);
const stoneVariants = variants([54], "background");
const christmasTreeVariants = variants(
  [9, 10, 25, 26, 41, 42],
  "background",
);
const snowFenceVariants = variants([17, 18, 19, 33, 49], "background");
const christmasTentVariants = variants([34, 50], "background");
const snowmanVariants = variants([35, 51], "background");
const treeVariants = variants(
  [
    ...range(11, 16),
    ...range(27, 32),
    ...range(43, 48),
    59,
    60,
  ],
  "background",
);
const cactusVariants = variants([63, 64, 79, 80], "background");
const fenceVariants = variants(
  [
    ...range(65, 71),
    ...range(81, 85),
    52,
    53,
  ],
  "background",
);
const skyVariants = variants([72, 73, 74], "background");
const moonVariants = variants([75, 76, 77], "background");

// ts(6,12/13/14) -> background variant 92/93/94（16×16 行优先编号）。
const waterfallVariants = variants([92, 93, 94], "background").map(
  (variant, index) => ({
    ...variant,
    label: ["Start", "Middle", "End"][index]!,
  }),
);

export const SURFACE_TERRAINS: readonly SurfaceTerrainDefinition[] = [
  {
    id: "grass",
    label: "草地",
    type: "ground",
    theme: "forest",
    themeFamily: "base-ground",
    primary: grassVariants[0]!.type,
    variants: grassVariants,
  },
  {
    id: "grass-water-edge",
    label: "水边草地",
    type: "ground",
    theme: "forest",
    primary: grassWaterEdgeVariants[0]!.type,
    variants: grassWaterEdgeVariants,
  },
  {
    id: "snow-ground",
    label: "雪地",
    type: "ground",
    theme: "snow",
    themeFamily: "base-ground",
    primary: snowGroundVariants[0]!.type,
    variants: snowGroundVariants,
  },
  {
    id: "sand",
    label: "沙地",
    type: "ground",
    theme: "desert",
    themeFamily: "base-ground",
    primary: sandVariants[0]!.type,
    variants: sandVariants,
  },
  {
    id: "cloud",
    label: "云层",
    type: "ground",
    theme: "space",
    themeFamily: "base-ground",
    primary: cloudVariants[0]!.type,
    variants: cloudVariants,
  },
  {
    id: "ice",
    label: "冰面",
    type: "ice",
    theme: "snow",
    primary: EntityTypeId.ICE,
    variants: [{ type: EntityTypeId.ICE, label: "Ice" }],
  },
  {
    id: "water",
    label: "水",
    type: "water",
    primary: EntityTypeId.WATER_ANIMATED,
    variants: [
      { type: EntityTypeId.WATER, label: "Still" },
      { type: EntityTypeId.WATER_ANIMATED, label: "Animated", weight: 2 },
      { type: EntityTypeId.WATER_VARIANT_1, label: "Variant 1" },
      { type: EntityTypeId.WATER_VARIANT_2, label: "Variant 2" },
      { type: EntityTypeId.WATER_VARIANT_3, label: "Variant 3" },
    ],
  },
  {
    id: "waterfall",
    label: "瀑布",
    type: "waterfall",
    primary: waterfallVariants[1]!.type,
    variants: waterfallVariants,
  },
  {
    id: "sky",
    label: "天空",
    type: "sky",
    theme: "space",
    primary: skyVariants[2]!.type,
    variants: skyVariants,
  },
  {
    id: "moon",
    label: "月亮",
    type: "sky",
    theme: "space",
    primary: moonVariants[0]!.type,
    variants: moonVariants,
  },
  {
    id: "stump",
    label: "木桩",
    type: "solid",
    theme: "forest",
    primary: stumpVariants[0]!.type,
    variants: stumpVariants,
  },
  {
    id: "flower-pot",
    label: "花盆",
    type: "solid",
    theme: "forest",
    primary: flowerPotVariants[0]!.type,
    variants: flowerPotVariants,
  },
  {
    id: "stone",
    label: "石头",
    type: "solid",
    theme: "forest",
    themeFamily: "rock",
    primary: stoneVariants[0]!.type,
    variants: stoneVariants,
  },
  {
    id: "stone-wall",
    label: "墙",
    type: "solid",
    theme: "forest",
    primary: stoneWallVariants[0]!.type,
    variants: stoneWallVariants,
  },
  {
    id: "tree",
    label: "树",
    type: "solid",
    theme: "forest",
    themeFamily: "vegetation",
    primary: treeVariants[0]!.type,
    variants: treeVariants,
  },
  {
    id: "fence",
    label: "篱笆",
    type: "solid",
    theme: "forest",
    themeFamily: "fence",
    primary: fenceVariants[0]!.type,
    variants: fenceVariants,
  },
  {
    id: "snow-rock",
    label: "带雪的石头",
    type: "solid",
    theme: "snow",
    themeFamily: "rock",
    primary: snowRockVariants[0]!.type,
    variants: snowRockVariants,
  },
  {
    id: "christmas-tree",
    label: "圣诞树",
    type: "solid",
    theme: "snow",
    themeFamily: "vegetation",
    primary: christmasTreeVariants[0]!.type,
    variants: christmasTreeVariants,
  },
  {
    id: "snow-fence",
    label: "带雪的篱笆",
    type: "solid",
    theme: "snow",
    themeFamily: "fence",
    primary: snowFenceVariants[0]!.type,
    variants: snowFenceVariants,
  },
  {
    id: "christmas-tent",
    label: "圣诞帐篷",
    type: "solid",
    theme: "snow",
    primary: christmasTentVariants[0]!.type,
    variants: christmasTentVariants,
  },
  {
    id: "snowman",
    label: "雪人",
    type: "solid",
    theme: "snow",
    primary: snowmanVariants[0]!.type,
    variants: snowmanVariants,
  },
  {
    id: "cactus",
    label: "仙人掌",
    type: "solid",
    theme: "desert",
    themeFamily: "vegetation",
    primary: cactusVariants[0]!.type,
    variants: cactusVariants,
  },
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
  {
    id: "environment",
    label: "Environment",
    rows: [["sky", "moon"]],
  },
];

export const SURFACE_THEMES: readonly SurfaceThemeDefinition[] = [
  {
    id: "mixed",
    label: "混合",
    preview: [
      grassVariants[0]!.type,
      snowGroundVariants[0]!.type,
      sandVariants[0]!.type,
      skyVariants[2]!.type,
    ],
  },
  {
    id: "forest",
    label: "森林",
    preview: [
      grassVariants[0]!.type,
      treeVariants[0]!.type,
      fenceVariants[0]!.type,
      stoneVariants[0]!.type,
    ],
  },
  {
    id: "snow",
    label: "雪地",
    preview: [
      snowGroundVariants[0]!.type,
      snowFenceVariants[0]!.type,
      christmasTreeVariants[0]!.type,
      snowRockVariants[0]!.type,
    ],
  },
  {
    id: "desert",
    label: "沙地",
    preview: [
      sandVariants[0]!.type,
      cactusVariants[0]!.type,
      cactusVariants[2]!.type,
      stoneVariants[0]!.type,
    ],
  },
  {
    id: "space",
    label: "太空",
    preview: [
      cloudVariants[0]!.type,
      skyVariants[0]!.type,
      skyVariants[2]!.type,
      moonVariants[0]!.type,
    ],
  },
];

const LEGACY_GROUND_TYPES = new Set<EntityType>([
  EntityTypeId.GROUND_A,
  EntityTypeId.GROUND_B,
  EntityTypeId.GROUND_C,
  EntityTypeId.GROUND_D,
]);
const surfaceTypes = new Set<EntityType>(
  SURFACE_TERRAINS.flatMap((terrain) =>
    terrain.variants.map((variant) => variant.type),
  ),
);
for (const type of LEGACY_GROUND_TYPES) surfaceTypes.add(type);

export function isSurfaceEntityType(type: EntityType): boolean {
  return surfaceTypes.has(type);
}

export function surfaceTerrain(
  id: SurfaceTerrainId,
): SurfaceTerrainDefinition {
  const terrain = SURFACE_TERRAINS.find((candidate) => candidate.id === id);
  if (!terrain) throw new Error(`Unknown Surface terrain: ${id}`);
  return terrain;
}

export function surfaceTerrainForEntity(
  type: EntityType,
): SurfaceTerrainDefinition | null {
  if (LEGACY_GROUND_TYPES.has(type)) return surfaceTerrain("grass");
  return (
    SURFACE_TERRAINS.find((terrain) =>
      terrain.variants.some((variant) => variant.type === type),
    ) ?? null
  );
}

export function defaultSurfaceBrush(): SurfaceBrush {
  return { terrain: "grass", pattern: "auto", seed: 1 };
}

export function detectSurfaceTheme(level: Readonly<EditorMap>): SurfaceTheme {
  const themes = new Set<ConcreteSurfaceTheme>();
  for (const entity of level.entities) {
    const terrain = surfaceTerrainForEntity(entity.type);
    if (terrain?.themeFamily && terrain.theme) themes.add(terrain.theme);
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
        if (!target || target.variants.length === 0) return entity;
        const type = weightedVariant(
          target.variants,
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
      if (cells.length === 0) return level;
      const target = new Set(
        cells.filter((cell) => inBounds(level, cell)).map(cellKey),
      );
      if (target.size === 0) return level;
      const kept = level.entities.filter(
        (entity) =>
          !target.has(cellKey(entity)) || !isSurfaceEntityType(entity.type),
      );
      const painted = [...target]
        .map((key) => {
          const cell = parseCellKey(key);
          return createSurfaceEntity(catalog, brush, cell, target);
        })
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
  if (!source) return paintSurface(catalog, [origin], brush);
  const sourceTerrain = surfaceTerrainForEntity(source.type);
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
    const terrain = entity ? surfaceTerrainForEntity(entity.type) : null;
    if (!terrain || terrain.id !== sourceTerrain.id) continue;
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
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) cells.push({ x, y });
  }
  return cells;
}

export function pickSurfaceBrush(
  level: Readonly<EditorMap>,
  cell: Cell,
): SurfaceBrush | null {
  const entity = surfaceAt(level, cell);
  if (!entity) return null;
  const terrain = surfaceTerrainForEntity(entity.type);
  if (!terrain) return null;
  return {
    terrain: terrain.id,
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
  const terrain = surfaceTerrain(brush.terrain);
  if (terrain.variants.length === 0) return null;
  let type: EntityType;
  if (
    brush.pattern === "exact" &&
    brush.exact &&
    terrain.variants.some((variant) => variant.type === brush.exact)
  ) {
    type = brush.exact;
  } else if (
    brush.pattern === "alternate" &&
    brush.alternate &&
    brush.alternate.every((candidate) =>
      terrain.variants.some((variant) => variant.type === candidate),
    )
  ) {
    type = brush.alternate[(cell.x + cell.y) & 1]!;
  } else if (terrain.type === "waterfall" && terrain.variants.length >= 3) {
    const above = target.has(cellKey({ x: cell.x, y: cell.y - 1 }));
    const below = target.has(cellKey({ x: cell.x, y: cell.y + 1 }));
    type = !above
      ? terrain.variants[0]!.type
      : !below
        ? terrain.variants[2]!.type
        : terrain.variants[1]!.type;
  } else {
    type = weightedVariant(terrain.variants, hashCell(cell, brush.seed));
  }
  catalog.require(type);
  return { type, x: cell.x, y: cell.y };
}

function weightedVariant(
  variants: readonly SurfaceVariant[],
  hash: number,
): EntityType {
  const total = variants.reduce(
    (sum, variant) => sum + (variant.weight ?? 1),
    0,
  );
  let target = hash % total;
  for (const variant of variants) {
    target -= variant.weight ?? 1;
    if (target < 0) return variant.type;
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
