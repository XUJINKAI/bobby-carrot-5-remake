import {
  MapEntityTypeId,
  originalTileCoordinateLabel,
  originalTileVisualGroup,
  type EntityType,
} from "@bobby/model";

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
  | "snow-cloud"
  | "grass"
  | "fence"
  | "hedge"
  | "tree"
  | "stone-wall"
  | "stump"
  | "flower-pot"
  | "stone"
  | "mushroom"
  | "snowman"
  | "christmas-cane"
  | "christmas-tree"
  | "snow-fence"
  | "snow-rock"
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

function bg(row: number, column: number): EntityType {
  return `ts-${row}-${column}`;
}

function walk(row: number, column: number): EntityType {
  return `ts-${row}-${column}`;
}

function variant(type: EntityType, label = type): SurfaceVariant {
  return { type, label };
}

function familyRows(type: string): SurfaceVariant[][] {
  const rows = new Map<number, SurfaceVariant[]>();
  for (const visual of originalTileVisualGroup(type).visuals) {
    const variants = rows.get(visual.row) ?? [];
    variants.push(variant(
      originalTileCoordinateLabel(visual),
      `${visual.row},${visual.column}`,
    ));
    rows.set(visual.row, variants);
  }
  return [...rows.values()];
}

function familyTypes(type: string): EntityType[] {
  return familyRows(type).flat().map((item) => item.type);
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

// 分组只定义 Editor 面板布局；语义归类与名称以 Original Tile Visual 目录为准。
const water = terrain({
  id: "water",
  label: "水",
  type: "water",
  primary: bg(6, 6),
  rows: familyRows("water"),
  auto: weighted([
    [bg(6, 6), 90],
    [bg(6, 7), 10],
  ], 5),
});

const waterfall = terrain({
  id: "waterfall",
  label: "瀑布",
  type: "waterfall",
  primary: bg(6, 13),
  rows: familyRows("waterfall"),
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
  rows: familyRows("starfield"),
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
  rows: familyRows("moon"),
});

const snowCloudTypes = familyTypes("snow-cloud");
const snowCloud = terrain({
  id: "snow-cloud",
  label: "雪地 / 云层",
  type: "ground",
  theme: "snow",
  themeFamily: "base-ground",
  rows: familyRows("snow-cloud"),
  auto: { kind: "weighted", variants: weights(snowCloudTypes), salt: 37 },
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
const grassTreeEdge = range(1, 2).map((column) => walk(10, column));
const grass = terrain({
  id: "grass",
  label: "草地",
  type: "ground",
  theme: "forest",
  themeFamily: "base-ground",
  rows: familyRows("grass"),
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

const fenceVariants = familyTypes("fence");
const fence = terrain({
  id: "fence",
  label: "木栅栏",
  type: "solid",
  slot: "overlay",
  theme: "forest",
  themeFamily: "fence",
  primary: MapEntityTypeId.FENCE,
  rows: familyRows("fence"),
  auto: {
    kind: "fence",
    variants: fenceVariants,
    canonical: MapEntityTypeId.FENCE,
  },
});

const hedge = terrain({
  id: "hedge",
  label: "篱笆",
  type: "solid",
  theme: "forest",
  rows: familyRows("hedge"),
});

const tree = terrain({
  id: "tree",
  label: "树",
  type: "solid",
  theme: "forest",
  rows: familyRows("tree"),
});

const stoneWall = terrain({
  id: "stone-wall",
  label: "石墙",
  type: "solid",
  theme: "forest",
  rows: familyRows("stone-wall"),
});

const stump = terrain({
  id: "stump",
  label: "木桩",
  type: "solid",
  theme: "forest",
  rows: familyRows("stump"),
});
const flowerPot = terrain({
  id: "flower-pot",
  label: "花盆",
  type: "solid",
  theme: "forest",
  rows: familyRows("flower-pot"),
});
const stone = terrain({
  id: "stone",
  label: "石头",
  type: "solid",
  theme: "forest",
  themeFamily: "rock",
  rows: familyRows("rock"),
});
const mushroom = terrain({
  id: "mushroom",
  label: "蘑菇",
  type: "solid",
  theme: "forest",
  rows: familyRows("mushroom"),
});

const snowman = terrain({
  id: "snowman",
  label: "雪人",
  type: "solid",
  theme: "snow",
  rows: familyRows("snowman"),
});
const christmasCane = terrain({
  id: "christmas-cane",
  label: "圣诞杖",
  type: "solid",
  theme: "snow",
  rows: familyRows("candy-cane"),
});
const christmasTree = terrain({
  id: "christmas-tree",
  label: "圣诞树",
  type: "solid",
  theme: "snow",
  rows: familyRows("christmas-tree"),
});
const snowFenceTypes = familyTypes("snow-fence");
const snowFence = terrain({
  id: "snow-fence",
  label: "雪地栅栏",
  type: "solid",
  slot: "overlay",
  theme: "snow",
  themeFamily: "fence",
  rows: familyRows("snow-fence"),
  auto: { kind: "fence", variants: snowFenceTypes },
});
const snowRock = terrain({
  id: "snow-rock",
  label: "带雪的石头",
  type: "solid",
  theme: "snow",
  themeFamily: "rock",
  rows: familyRows("snowy-rock"),
});

const cactus = terrain({
  id: "cactus",
  label: "仙人掌",
  type: "solid",
  theme: "desert",
  rows: familyRows("cactus"),
  // Auto 选取两种单格形态；纵向形态由精确画笔放置。
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
  rows: familyRows("sand"),
});

// Ice 仍是 Surface gameplay terrain；它不是本次 surface.md 新列的静态 ts 分类之一。
const ice = terrain({
  id: "ice",
  label: "冰面",
  type: "ice",
  theme: "snow",
  rows: [[variant(MapEntityTypeId.ICE, "Ice")]],
});

export const SURFACE_TERRAINS: readonly SurfaceTerrainDefinition[] = [
  water,
  waterfall,
  starfield,
  moon,
  snowCloud,
  grass,
  fence,
  hedge,
  tree,
  stoneWall,
  stump,
  flowerPot,
  stone,
  mushroom,
  snowman,
  christmasCane,
  christmasTree,
  snowFence,
  snowRock,
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
      ["snow-cloud"],
    ],
  },
  {
    id: "forest",
    label: "森林",
    rows: [
      ["grass", "fence", "hedge", "tree"],
      ["stone-wall", "stump", "flower-pot"],
      ["stone", "mushroom"],
    ],
  },
  {
    id: "snow",
    label: "雪地（圣诞）",
    rows: [
      ["snow-cloud", "snow-rock", "snow-fence", "ice"],
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
