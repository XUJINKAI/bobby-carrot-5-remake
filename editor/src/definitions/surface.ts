import { EntityTypeId, type EntityType } from "@bobby/model";

export type SurfaceType =
  | "ground"
  | "solid"
  | "water"
  | "ice"
  | "sky"
  | "waterfall";
export type SurfaceSlot = "base" | "overlay";
export type SurfaceTheme = "mixed" | "forest" | "snow" | "desert" | "space";
export type SurfacePattern = "auto" | "exact" | "alternate";
export type SurfaceTool = "brush" | "rect" | "fill";
export type SurfaceTerrainId =
  | "water"
  | "waterfall"
  | "starfield"
  | "moon"
  | "cloud"
  | "grass"
  | "wood-fence"
  | "hedge"
  | "tree"
  | "stone-wall-1"
  | "stone-wall-2"
  | "stump"
  | "flower-pot"
  | "stone"
  | "mushroom"
  | "snowman"
  | "christmas-cane"
  | "christmas-tree"
  | "snow-fence"
  | "snow-rock"
  | "snow-ground"
  | "cactus"
  | "sand"
  | "ice";

type ConcreteSurfaceTheme = Exclude<SurfaceTheme, "mixed">;

export interface SurfaceVariant {
  type: EntityType;
  label: string;
}

export interface SurfaceWeightedVariant {
  type: EntityType;
  weight: number;
}

export type SurfaceAutoDefinition =
  | { kind: "primary" }
  | {
      kind: "weighted";
      variants: readonly SurfaceWeightedVariant[];
      salt?: number;
    }
  | {
      kind: "vertical";
      start: EntityType;
      middle: EntityType;
      end: EntityType;
    }
  | {
      /** variants 的顺序对应连接形态；canonical 用于木栅栏这种 Engine Entity。 */
      kind: "fence";
      variants: readonly EntityType[];
      canonical?: EntityType;
    }
  | {
      /** 相邻指定 Surface terrain 时切换到对应 variant pool。 */
      kind: "neighbor";
      fallback: readonly SurfaceWeightedVariant[];
      rules: readonly {
        neighborTerrains: readonly SurfaceTerrainId[];
        variants: readonly SurfaceWeightedVariant[];
      }[];
      salt?: number;
    }
  | {
      /** 旧实验策略，仅为兼容已有代码路径；当前 Catalog 不使用多格 Auto。 */
      kind: "paired-vertical";
      top: EntityType;
      bottom: EntityType;
      singles: readonly SurfaceWeightedVariant[];
      salt?: number;
    };

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
  /** base 每格最多一个；overlay 用于透明叠加但仍属于地貌的 Surface。 */
  slot: SurfaceSlot;
  primary: EntityType;
  /** Surface 面板按这里的二维布局原样显示 variant。 */
  rows: readonly (readonly SurfaceVariant[])[];
  /** Auto 的选图策略完全由 Catalog 决定。 */
  auto: SurfaceAutoDefinition;
  theme?: ConcreteSurfaceTheme;
  /** 主题切换只在相同 family / type / slot 内替换。 */
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

function bg(row: number, column: number): EntityType {
  return backgroundVariant((row - 1) * 16 + column);
}

function walk(row: number, column: number): EntityType {
  return walkableVariant((row - 7) * 16 + column);
}

function variant(type: EntityType, label = type): SurfaceVariant {
  return { type, label };
}

function bgRow(row: number, columns: readonly number[]): SurfaceVariant[] {
  return columns.map((column) => variant(bg(row, column), `${row},${column}`));
}

function walkRow(row: number, columns: readonly number[]): SurfaceVariant[] {
  return columns.map((column) => variant(walk(row, column), `${row},${column}`));
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function weighted(
  entries: readonly [EntityType, number][],
  salt = 0,
): SurfaceAutoDefinition {
  return {
    kind: "weighted",
    variants: entries.map(([type, weight]) => ({ type, weight })),
    ...(salt ? { salt } : {}),
  };
}

function weights(types: readonly EntityType[], weight = 1): SurfaceWeightedVariant[] {
  return types.map((type) => ({ type, weight }));
}

function terrain(
  definition: Omit<
    SurfaceTerrainDefinition,
    "primary" | "slot" | "auto"
  > & {
    primary?: EntityType;
    slot?: SurfaceSlot;
    auto?: SurfaceAutoDefinition;
  },
): SurfaceTerrainDefinition {
  const first = definition.rows.flat()[0]?.type;
  if (!definition.primary && !first)
    throw new Error(`Surface terrain ${definition.id} has no variants`);
  return {
    ...definition,
    primary: definition.primary ?? first!,
    slot: definition.slot ?? "base",
    auto: definition.auto ?? { kind: "primary" },
  };
}

// 本文件直接对应 docs/system/original/surface.md。
// 坐标只在这里维护；authoring 算法不再散落具体 ts.png 号码。
const water = terrain({
  id: "water",
  label: "水",
  type: "water",
  primary: EntityTypeId.WATER,
  rows: [[
    variant(EntityTypeId.WATER, "6,6 水面"),
    variant(EntityTypeId.WATER_ANIMATED, "6,7 涟漪"),
  ]],
  auto: weighted([
    [EntityTypeId.WATER, 90],
    [EntityTypeId.WATER_ANIMATED, 10],
  ], 5),
});

const waterfall = terrain({
  id: "waterfall",
  label: "瀑布",
  type: "waterfall",
  primary: bg(6, 13),
  rows: [[
    variant(bg(6, 12), "6,12 顶部"),
    variant(bg(6, 13), "6,13 中段"),
    variant(bg(6, 14), "6,14 底部"),
  ]],
  auto: {
    kind: "vertical",
    start: bg(6, 12),
    middle: bg(6, 13),
    end: bg(6, 14),
  },
});

const starfield = terrain({
  id: "starfield",
  label: "星空",
  type: "sky",
  theme: "space",
  primary: bg(5, 10),
  rows: [[
    variant(bg(5, 8), "5,8 大星星"),
    variant(bg(5, 9), "5,9 小星星"),
    variant(bg(5, 10), "5,10 星空"),
  ]],
  auto: weighted([
    [bg(5, 8), 5],
    [bg(5, 9), 10],
    [bg(5, 10), 85],
  ], 17),
});

const moon = terrain({
  id: "moon",
  label: "月亮",
  type: "sky",
  theme: "space",
  rows: [[
    variant(bg(5, 11), "5,11 左上"),
    variant(bg(5, 12), "5,12 右上"),
    variant(bg(5, 13), "5,13 右下"),
  ]],
});

const cloudTypes = [
  ...range(9, 14).map((column) => walk(7, column)),
  ...range(9, 14).map((column) => walk(8, column)),
  walk(9, 7),
  walk(9, 8),
  ...range(9, 14).map((column) => walk(9, column)),
];
const cloud = terrain({
  id: "cloud",
  label: "云层",
  type: "ground",
  theme: "space",
  themeFamily: "base-ground",
  rows: [
    walkRow(7, range(9, 14)),
    walkRow(8, range(9, 14)),
    walkRow(9, range(7, 14)),
  ],
  auto: { kind: "weighted", variants: weights(cloudTypes), salt: 37 },
});

const grassNormal = [
  ...range(1, 3).map((column) => walk(7, column)),
  ...range(1, 3).map((column) => walk(8, column)),
  ...range(1, 3).map((column) => walk(9, column)),
  bg(6, 15),
  bg(6, 16),
];
const grassWaterEdge = [
  ...range(4, 6).map((column) => walk(7, column)),
  ...range(4, 6).map((column) => walk(8, column)),
  ...range(4, 6).map((column) => walk(9, column)),
  walk(7, 7),
  walk(7, 8),
  walk(8, 7),
  walk(8, 8),
];
const grassTreeEdge = range(1, 4).map((column) => walk(10, column));
const grass = terrain({
  id: "grass",
  label: "草地",
  type: "ground",
  theme: "forest",
  themeFamily: "base-ground",
  rows: [
    [
      ...walkRow(7, range(1, 3)),
      ...bgRow(6, [15, 16]),
    ],
    walkRow(8, range(1, 3)),
    walkRow(9, range(1, 3)),
    [
      ...walkRow(7, range(4, 8)),
      ...walkRow(8, range(4, 8)),
    ],
    walkRow(9, range(4, 6)),
    walkRow(10, range(1, 4)),
  ],
  auto: {
    kind: "neighbor",
    fallback: weights(grassNormal),
    rules: [
      { neighborTerrains: ["water", "waterfall"], variants: weights(grassWaterEdge) },
      { neighborTerrains: ["tree", "hedge"], variants: weights(grassTreeEdge) },
    ],
    salt: 11,
  },
});

const woodFenceVariants = range(10, 15).map((column) => bg(16, column));
const woodFence = terrain({
  id: "wood-fence",
  label: "木栅栏",
  type: "solid",
  slot: "overlay",
  theme: "forest",
  themeFamily: "fence",
  primary: EntityTypeId.FENCE,
  rows: [bgRow(16, range(10, 15))],
  auto: {
    kind: "fence",
    variants: woodFenceVariants,
    canonical: EntityTypeId.FENCE,
  },
});

const hedge = terrain({
  id: "hedge",
  label: "篱笆",
  type: "solid",
  theme: "forest",
  rows: [
    bgRow(4, [4, 5]),
    bgRow(5, range(1, 7)),
    bgRow(6, range(1, 5)),
  ],
});

const tree = terrain({
  id: "tree",
  label: "树",
  type: "solid",
  theme: "forest",
  rows: [
    bgRow(1, range(11, 16)),
    bgRow(2, range(11, 16)),
    bgRow(3, range(11, 16)),
    bgRow(4, [11, 12]),
  ],
});

const stoneWall1 = terrain({
  id: "stone-wall-1",
  label: "石头墙1",
  type: "solid",
  theme: "forest",
  rows: [
    bgRow(1, range(4, 6)),
    bgRow(2, range(4, 6)),
    bgRow(3, range(4, 6)),
  ],
});

const stoneWall2 = terrain({
  id: "stone-wall-2",
  label: "石头墙2",
  type: "solid",
  theme: "forest",
  rows: [
    bgRow(1, range(7, 8)),
    bgRow(2, range(7, 8)),
    bgRow(3, range(7, 8)),
    bgRow(4, range(7, 10)),
  ],
});

const stump = terrain({
  id: "stump",
  label: "木桩",
  type: "solid",
  theme: "forest",
  rows: [[variant(bg(1, 1), "1,1")]],
});
const flowerPot = terrain({
  id: "flower-pot",
  label: "花盆",
  type: "solid",
  theme: "forest",
  rows: [[variant(bg(1, 3), "1,3")]],
});
const stone = terrain({
  id: "stone",
  label: "石头",
  type: "solid",
  theme: "forest",
  themeFamily: "rock",
  rows: [[variant(bg(4, 6), "4,6")]],
});
const mushroom = terrain({
  id: "mushroom",
  label: "蘑菇",
  type: "solid",
  theme: "forest",
  rows: [[variant(bg(4, 14), "4,14")]],
});

const snowman = terrain({
  id: "snowman",
  label: "雪人",
  type: "solid",
  theme: "snow",
  rows: [[variant(bg(3, 3), "3,3 上"), variant(bg(4, 3), "4,3 下")]],
});
const christmasCane = terrain({
  id: "christmas-cane",
  label: "圣诞杖",
  type: "solid",
  theme: "snow",
  rows: [[variant(bg(3, 2), "3,2 上"), variant(bg(4, 2), "4,2 下")]],
});
const christmasTree = terrain({
  id: "christmas-tree",
  label: "圣诞树",
  type: "solid",
  theme: "snow",
  rows: [
    bgRow(1, [9, 10]),
    bgRow(2, [9, 10]),
    bgRow(3, [9, 10]),
  ],
});
const snowFenceTypes = [bg(2, 1), bg(2, 2), bg(2, 3), bg(3, 1), bg(4, 1)];
const snowFence = terrain({
  id: "snow-fence",
  label: "雪地栅栏",
  type: "solid",
  slot: "overlay",
  theme: "snow",
  themeFamily: "fence",
  rows: [bgRow(2, range(1, 3)), bgRow(3, [1]), bgRow(4, [1])],
  auto: { kind: "fence", variants: snowFenceTypes },
});
const snowRock = terrain({
  id: "snow-rock",
  label: "带雪的石头",
  type: "solid",
  theme: "snow",
  themeFamily: "rock",
  rows: [[variant(bg(1, 2), "1,2")]],
});
const snowGround = terrain({
  id: "snow-ground",
  label: "雪地",
  type: "ground",
  theme: "snow",
  themeFamily: "base-ground",
  rows: [walkRow(7, [15, 16]), walkRow(8, [15, 16]), walkRow(9, [15])],
  auto: weighted([
    [walk(7, 15), 70],
    [walk(7, 16), 10],
    [walk(8, 15), 8],
    [walk(8, 16), 7],
    [walk(9, 15), 5],
  ], 23),
});

const cactus = terrain({
  id: "cactus",
  label: "仙人掌",
  type: "solid",
  theme: "desert",
  rows: [
    [variant(bg(4, 15), "4,15 小仙人掌"), variant(bg(5, 15), "5,15 仙人球")],
    [variant(bg(4, 16), "4,16 两格上"), variant(bg(5, 16), "5,16 两格下")],
  ],
  // Composite Surface Asset 延期；Auto 只在单格仙人掌中做加权选择。
  auto: weighted([
    [bg(4, 15), 3],
    [bg(5, 15), 1],
  ], 43),
});
const sand = terrain({
  id: "sand",
  label: "沙地",
  type: "ground",
  theme: "desert",
  themeFamily: "base-ground",
  rows: [[variant(walk(9, 16), "9,16")]],
});

// Ice 仍是 Surface gameplay terrain；它不是本次 surface.md 新列的静态 ts 分类之一。
const ice = terrain({
  id: "ice",
  label: "冰面",
  type: "ice",
  theme: "snow",
  rows: [[variant(EntityTypeId.ICE, "Ice")]],
});

export const SURFACE_TERRAINS: readonly SurfaceTerrainDefinition[] = [
  water,
  waterfall,
  starfield,
  moon,
  cloud,
  grass,
  woodFence,
  hedge,
  tree,
  stoneWall1,
  stoneWall2,
  stump,
  flowerPot,
  stone,
  mushroom,
  snowman,
  christmasCane,
  christmasTree,
  snowFence,
  snowRock,
  snowGround,
  cactus,
  sand,
  ice,
];

export const SURFACE_TERRAIN_GROUPS: readonly SurfaceTerrainGroup[] = [
  {
    id: "water-space",
    label: "水与太空",
    rows: [
      ["water", "waterfall", "starfield", "moon"],
      ["cloud"],
    ],
  },
  {
    id: "forest",
    label: "森林",
    rows: [
      ["grass", "wood-fence", "hedge", "tree"],
      ["stone-wall-1", "stone-wall-2", "stump", "flower-pot"],
      ["stone", "mushroom"],
    ],
  },
  {
    id: "snow",
    label: "雪地（圣诞）",
    rows: [
      ["snow-ground", "snow-rock", "snow-fence", "ice"],
      ["snowman", "christmas-cane", "christmas-tree"],
    ],
  },
  {
    id: "desert",
    label: "沙漠",
    rows: [["sand", "cactus"]],
  },
];

export const SURFACE_THEMES: readonly SurfaceThemeDefinition[] = [
  {
    id: "mixed",
    label: "混合",
    preview: [walk(7, 1), walk(7, 15), walk(9, 16), bg(5, 10)],
  },
  {
    id: "forest",
    label: "森林",
    preview: [walk(7, 1), bg(1, 11), bg(4, 6), bg(16, 10)],
  },
  {
    id: "snow",
    label: "雪地",
    preview: [walk(7, 15), bg(1, 2), bg(1, 9), bg(3, 3)],
  },
  {
    id: "desert",
    label: "沙地",
    preview: [walk(9, 16), bg(4, 15), bg(5, 15), bg(4, 16)],
  },
  {
    id: "space",
    label: "太空",
    preview: [bg(5, 10), bg(5, 8), walk(7, 9), bg(5, 11)],
  },
];

export const LEGACY_GROUND_TYPES = new Set<EntityType>([
  EntityTypeId.GROUND_A,
  EntityTypeId.GROUND_B,
  EntityTypeId.GROUND_C,
  EntityTypeId.GROUND_D,
]);
