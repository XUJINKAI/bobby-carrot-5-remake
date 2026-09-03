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
}

export type SurfaceAutoDefinition =
  | { kind: "primary" }
  | {
      kind: "weighted";
      variants: readonly { type: EntityType; weight: number }[];
      /** 只影响该 Terrain 的稳定散列分布，便于单独调视觉。 */
      salt?: number;
    }
  | {
      kind: "vertical";
      start: EntityType;
      middle: EntityType;
      end: EntityType;
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
  /** base 每格最多一个；overlay 用于 Fence 这种透明但仍属于地貌的层。 */
  slot: SurfaceSlot;
  primary: EntityType;
  /** Surface 面板按这里的二维布局原样显示 variant。 */
  rows: readonly (readonly SurfaceVariant[])[];
  /** Auto 的选图策略完全由 Catalog 决定，authoring 逻辑只执行策略。 */
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

function variant(
  number: number,
  kind: "walkable" | "background",
): SurfaceVariant {
  return {
    type:
      kind === "walkable"
        ? walkableVariant(number)
        : backgroundVariant(number),
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

// Surface 的分类、排列、variant 和 Auto 策略统一在这里调。
// background variant 号码直接对应 docs/system/original/surface.md 的 ts.png 1-based 线性格。
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
  auto: weighted(
    [
      [walkableVariant(1), 12],
      [walkableVariant(2), 3],
      [walkableVariant(17), 3],
      [walkableVariant(18), 2],
      [walkableVariant(33), 2],
      [walkableVariant(34), 1],
    ],
    11,
  ),
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
  rows: [
    variantRow([15, 16], "walkable"),
    variantRow([31, 32, 47], "walkable"),
  ],
  auto: weighted(
    [
      [walkableVariant(15), 10],
      [walkableVariant(16), 3],
      [walkableVariant(31), 2],
      [walkableVariant(32), 1],
    ],
    23,
  ),
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
    variantRow(range(39, 46), "walkable"),
  ],
  auto: weighted(
    [
      [walkableVariant(9), 8],
      [walkableVariant(10), 3],
      [walkableVariant(25), 3],
      [walkableVariant(26), 2],
      [walkableVariant(39), 2],
    ],
    37,
  ),
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
  rows: [
    [
      { type: EntityTypeId.WATER, label: "Still" },
      { type: EntityTypeId.WATER_ANIMATED, label: "Animated" },
      { type: EntityTypeId.WATER_VARIANT_1, label: "Variant 1" },
      { type: EntityTypeId.WATER_VARIANT_2, label: "Variant 2" },
      { type: EntityTypeId.WATER_VARIANT_3, label: "Variant 3" },
    ],
  ],
  auto: weighted([
    [EntityTypeId.WATER_ANIMATED, 8],
    [EntityTypeId.WATER, 2],
    [EntityTypeId.WATER_VARIANT_1, 1],
    [EntityTypeId.WATER_VARIANT_2, 1],
    [EntityTypeId.WATER_VARIANT_3, 1],
  ]),
});

const waterfall = terrain({
  id: "waterfall",
  label: "瀑布",
  type: "waterfall",
  primary: backgroundVariant(93),
  rows: [
    [
      { type: backgroundVariant(92), label: "Start" },
      { type: backgroundVariant(93), label: "Middle" },
      { type: backgroundVariant(94), label: "End" },
    ],
  ],
  auto: {
    kind: "vertical",
    start: backgroundVariant(92),
    middle: backgroundVariant(93),
    end: backgroundVariant(94),
  },
});

const sky = terrain({
  id: "sky",
  label: "星空",
  type: "sky",
  theme: "space",
  primary: backgroundVariant(74),
  rows: [variantRow([65, 73, 74], "background")],
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
  label: "石墙",
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
  slot: "overlay",
  theme: "forest",
  themeFamily: "fence",
  primary: EntityTypeId.FENCE,
  rows: [[{ type: EntityTypeId.FENCE, label: "Auto" }]],
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
  rows: [
    variantRow([9, 10], "background"),
    variantRow([25, 26], "background"),
    variantRow([41, 42], "background"),
  ],
});

const snowFence = terrain({
  id: "snow-fence",
  label: "带雪的篱笆",
  type: "solid",
  slot: "overlay",
  theme: "snow",
  themeFamily: "fence",
  rows: [
    variantRow([17, 18, 19], "background"),
    variantRow([33, 49], "background"),
  ],
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
  rows: [
    variantRow([63, 64], "background"),
    variantRow([79, 80], "background"),
  ],
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
    label: "地面",
    rows: [
      ["grass", "snow-ground", "sand", "cloud"],
      ["grass-water-edge", "ice", "water", "waterfall"],
    ],
  },
  {
    id: "obstacle",
    label: "障碍",
    rows: [
      ["stone", "stone-wall", "tree", "stump"],
      ["snow-rock", "christmas-tree", "christmas-tent", "snowman"],
      ["cactus"],
    ],
  },
  {
    id: "overlay",
    label: "叠加地貌",
    rows: [["fence", "snow-fence"]],
  },
  {
    id: "environment",
    label: "环境",
    rows: [["sky", "moon"]],
  },
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
    preview: [
      snowGround.primary,
      snowFence.primary,
      christmasTree.primary,
      snowRock.primary,
    ],
  },
  {
    id: "desert",
    label: "沙地",
    preview: [sand.primary, cactus.primary, cactus.rows.flat()[2]!.type, stone.primary],
  },
  {
    id: "space",
    label: "太空",
    preview: [cloud.primary, backgroundVariant(65), backgroundVariant(73), moon.primary],
  },
];

export const LEGACY_GROUND_TYPES: ReadonlySet<EntityType> = new Set([
  EntityTypeId.GROUND_A,
  EntityTypeId.GROUND_B,
  EntityTypeId.GROUND_C,
  EntityTypeId.GROUND_D,
]);
