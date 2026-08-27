import { EntityTypeId } from "@bobby/model";
import type { EntityDefinition, EntityTrait } from "../../world/entity/EntityDefinition.js";

const surface = (
  type: string,
  name: string,
  traits: readonly EntityTrait[] = ["walkable"],
  extra: Partial<EntityDefinition> = {},
): EntityDefinition => ({
  type,
  traits,
  stackBand: "surface",
  occupancy: { group: "surface", replaceSameGroup: true },
  presentation: { name, category: "地表" },
  authoring: { palette: true, category: "地表" },
  ...extra,
});

const content = (
  type: string,
  name: string,
  traits: readonly EntityTrait[] = [],
  extra: Partial<EntityDefinition> = {},
): EntityDefinition => ({
  type,
  traits,
  stackBand: "content",
  presentation: { name, category: "实体" },
  authoring: { palette: true, category: "实体" },
  ...extra,
});

const cover = (
  type: string,
  name: string,
  traits: readonly EntityTrait[] = [],
  extra: Partial<EntityDefinition> = {},
): EntityDefinition => ({
  type,
  traits,
  stackBand: "cover",
  occupancy: { group: "cover", replaceSameGroup: true },
  presentation: { name, category: "覆盖" },
  authoring: { palette: true, category: "覆盖" },
  ...extra,
});

const pressedState = [{ key: "pressed", kind: "boolean" as const, label: "按下", default: false }];
const activeState = (value = false) => [
  { key: "active", kind: "boolean" as const, label: "激活", default: value },
];
const variant = (values: readonly (string | number)[]) => [{
  key: "variant",
  kind: "enum" as const,
  label: "形态",
  default: values[0]!,
  options: values.map((value) => ({ value })),
}];

const surfaces: EntityDefinition[] = [
  surface(EntityTypeId.GROUND_A, "Ground A"),
  surface(EntityTypeId.GROUND_B, "Ground B"),
  surface(EntityTypeId.GROUND_C, "Ground C"),
  surface(EntityTypeId.GROUND_D, "Ground D"),
  surface(EntityTypeId.SHOVEL_CLEARED_GROUND, "Shovel Cleared Ground"),
  surface(EntityTypeId.EXIT, "Exit", ["walkable", "exit"], {
    presentation: { name: "Exit", category: "目标" },
    authoring: { palette: true, category: "目标" },
  }),
  surface(EntityTypeId.ICE, "Ice", ["walkable", "forced-movement"]),
  surface(EntityTypeId.SHOP_DREAM, "Dream Shop"),
  surface(EntityTypeId.SHOP_CLOUD9, "Cloud 9 Shop"),
  surface(EntityTypeId.SHOP_SUPER_KEY, "Super Key Shop"),
  surface(EntityTypeId.SHOP_STEREO, "Stereo Shop"),
  surface(EntityTypeId.SHOP_MUSIC, "Music Shop"),
  surface(EntityTypeId.SHOP_SPEED_SHOES, "Speed Shoes Shop"),
  surface(EntityTypeId.SHOP_COIN_RADAR, "Coin Radar Shop"),
  surface(EntityTypeId.SHOP_UNAVAILABLE, "Unavailable Shop"),
  surface(EntityTypeId.SHOVEL_PICKUP, "Shovel Pickup", ["walkable", "pickup"]),
  surface(EntityTypeId.MOWER_PARKING, "Mower Parking"),
  surface(EntityTypeId.TIDE, "Tide", ["water", "forced-movement"], {
    authoring: { palette: true, category: "水域", defaultDirection: "right" },
    presentation: { name: "Tide", category: "水域" },
  }),
  surface(EntityTypeId.TIDE_SWITCH, "Tide Switch", ["walkable", "switch"], {
    state: pressedState,
  }),
  surface(EntityTypeId.SPEED_SWITCH, "Speed Switch", ["walkable", "switch"], {
    state: pressedState,
  }),
  surface(EntityTypeId.CAROUSEL_SWITCH, "Carousel Switch", ["walkable", "switch"], {
    state: pressedState,
  }),
  surface(EntityTypeId.WIND_SWITCH, "Wind Switch", ["walkable", "switch"], {
    properties: [{
      key: "channel",
      kind: "enum",
      label: "频道",
      default: 0,
      options: [0, 1, 2, 3].map((value) => ({ value })),
    }],
    state: activeState(false),
  }),
  surface(EntityTypeId.TRAP, "Trap", ["walkable", "hazard"], {
    state: activeState(true),
  }),
  surface(EntityTypeId.MIRROR, "Mirror", ["walkable", "mirror", "rotatable"], {
    state: variant([1, 2, 3, 4]),
  }),
  surface(EntityTypeId.SPEED, "Speed", ["walkable", "forced-movement"], {
    authoring: { palette: true, category: "机关", defaultDirection: "right" },
    presentation: { name: "Speed", category: "机关" },
  }),
  surface(EntityTypeId.CAROUSEL, "Carousel", ["walkable", "carousel", "directional-passage", "rotatable"], {
    state: variant([1, 2, 3, 4, "vertical", "horizontal"]),
  }),
  surface(EntityTypeId.COLOR_YELLOW_SWITCH, "Yellow Switch", ["walkable", "switch"], {
    state: pressedState,
  }),
  surface(EntityTypeId.COLOR_PINK_SWITCH, "Pink Switch", ["walkable", "switch"], {
    state: pressedState,
  }),
  surface(EntityTypeId.COLOR_YELLOW_BLOCK, "Yellow Block", ["stateful-block"], {
    state: [{ key: "raised", kind: "boolean", label: "升起", default: true }],
  }),
  surface(EntityTypeId.COLOR_PINK_BLOCK, "Pink Block", ["stateful-block"], {
    state: [{ key: "raised", kind: "boolean", label: "升起", default: true }],
  }),
];

const waterTypes = [
  [EntityTypeId.WATER, "Water"],
  [EntityTypeId.WATER_ANIMATED, "Animated Water"],
  [EntityTypeId.WATER_VARIANT_1, "Water Variant 1"],
  [EntityTypeId.WATER_VARIANT_2, "Water Variant 2"],
  [EntityTypeId.WATER_VARIANT_3, "Water Variant 3"],
] as const;
for (const [type, name] of waterTypes)
  surfaces.push(surface(type, name, ["water"], {
    presentation: { name, category: "水域" },
    authoring: { palette: true, category: "水域" },
  }));

const covers: EntityDefinition[] = [
  cover(EntityTypeId.SNOW, "Snow", ["snow", "shovelable", "blocking"]),
  cover(EntityTypeId.HIGH_GRASS, "High Grass", ["mowable", "blocking"]),
  cover(EntityTypeId.HIGH_GRASS_OBJECTIVE, "High Grass Objective", ["mowable", "blocking", "hidden-objective"]),
  cover(EntityTypeId.ICE_BLOCK, "Ice Block", ["meltable"], {
    state: [{
      key: "meltStage",
      kind: "enum",
      label: "融化阶段",
      default: 0,
      options: [0, 1, 2, 3].map((value) => ({ value })),
    }],
  }),
];

const contents: EntityDefinition[] = [
  content(EntityTypeId.BOBBY, "Bobby", ["player"], {
    occupancy: { group: "actor" },
    authoring: { palette: true, category: "角色", defaultDirection: "down" },
    presentation: { name: "Bobby", category: "角色" },
  }),
  content(EntityTypeId.CONSUMED_CARROT, "Consumed Carrot", [], {
    authoring: { palette: false, category: "内部" },
  }),
  content(EntityTypeId.CARROT, "Carrot", ["collectible", "objective-carrot", "level-objective"], {
    occupancy: { group: "item", replaceSameGroup: true },
    presentation: { name: "Carrot", category: "目标" },
    authoring: { palette: true, category: "目标" },
  }),
  content(EntityTypeId.EGG_NEST_EMPTY, "Empty Egg Nest", ["objective-nest", "level-objective"], {
    occupancy: { group: "item", replaceSameGroup: true },
    presentation: { name: "Empty Egg Nest", category: "目标" },
    authoring: { palette: true, category: "目标" },
  }),
  content(EntityTypeId.EGG_NEST_FILLED, "Filled Egg Nest", [], {
    occupancy: { group: "item", replaceSameGroup: true },
  }),
  content(EntityTypeId.LOCK, "Lock", ["blocking", "gate"]),
  content(EntityTypeId.BEANSTALK_TIP, "Beanstalk Tip", ["terrain-overlay", "climbable"]),
  content(EntityTypeId.BEAN, "Bean", ["pickup"]),
  content(EntityTypeId.WINDMILL_UP, "Windmill Up"),
  content(EntityTypeId.WINDMILL_DOWN, "Windmill Down"),
  content(EntityTypeId.WINDMILL_LEFT, "Windmill Left"),
  content(EntityTypeId.WINDMILL_RIGHT, "Windmill Right"),
  content(EntityTypeId.PLANK, "Plank", ["terrain-overlay"]),
  content(EntityTypeId.PLANK_CRUMBLING, "Crumbling Plank", ["terrain-overlay"], {
    authoring: { palette: false, category: "内部" },
  }),
  content(EntityTypeId.PLANK_FRAGMENT, "Plank Fragment", [], {
    authoring: { palette: false, category: "内部" },
  }),
  content(EntityTypeId.DRAGON, "Dragon", ["dragon"], {
    occupancy: { group: "actor" },
    footprint: {
      parts: [
        { dx: 0, dy: 0, role: "head", traits: ["blocking", "dragon-fire-blocking"] },
        { dx: 1, dy: 0, role: "body", traits: ["blocking", "dragon-fire-blocking"] },
        { dx: 2, dy: 0, role: "tail", traits: ["walkable", "dragon-trigger"] },
      ],
    },
    presentation: { name: "Dragon", category: "角色" },
    authoring: { palette: true, category: "角色", cursor: { dx: 1, dy: 0 }, defaultDirection: "right" },
  }),
  content(EntityTypeId.SANDMAN, "Sandman", ["blocking"], {
    occupancy: { group: "actor" },
    footprint: { parts: [{ dx: 0, dy: 0, role: "head" }, { dx: 0, dy: 1, role: "body" }] },
    presentation: { name: "Sandman", category: "角色" },
    authoring: { palette: true, category: "角色" },
  }),
  content(EntityTypeId.DREAM_MACHINE, "Dream Machine", ["blocking"], {
    occupancy: { group: "actor" },
    footprint: { parts: [{ dx: 0, dy: 0, role: "head" }, { dx: 0, dy: 1, role: "body" }] },
    presentation: { name: "Dream Machine", category: "角色" },
    authoring: { palette: true, category: "角色" },
  }),
  content(EntityTypeId.MOWER, "Mower", ["vehicle"]),
  content(EntityTypeId.GAS, "Gas", ["pickup"]),
  content(EntityTypeId.BEANSTALK_MID, "Beanstalk Mid", ["terrain-overlay", "climbable"]),
  content(EntityTypeId.BEAN_FIELD, "Bean Field"),
  content(EntityTypeId.CLOUD_RED, "Red Cloud", ["vehicle", "cloud"]),
  content(EntityTypeId.CLOUD_PURPLE, "Purple Cloud", ["vehicle", "cloud"]),
  content(EntityTypeId.CLOUD_GREEN, "Green Cloud", ["vehicle", "cloud"]),
  content(EntityTypeId.BEAVER, "Beaver", ["blocking"], {
    occupancy: { group: "actor" },
    footprint: { parts: [{ dx: 0, dy: 0, role: "head" }, { dx: 0, dy: 1, role: "body" }] },
    presentation: { name: "Beaver", category: "角色" },
    authoring: { palette: true, category: "角色" },
  }),
  content(EntityTypeId.LEAF, "Leaf", ["vehicle", "leaf"]),
  content(EntityTypeId.CRUMBLY_ROCK, "Crumbly Rock", ["dragon-fire-blocking"]),
  content(EntityTypeId.BEANSTALK_BASE, "Beanstalk Base", ["terrain-overlay", "climbable"]),
  content(EntityTypeId.BEAN_SPROUT, "Bean Sprout", [], {
    authoring: { palette: false, category: "内部" },
  }),
  content(EntityTypeId.CLOUD_GRID_RED, "Red Cloud Grid"),
  content(EntityTypeId.CLOUD_GRID_PURPLE, "Purple Cloud Grid"),
  content(EntityTypeId.CLOUD_GRID_GREEN, "Green Cloud Grid"),
  content(EntityTypeId.KITE, "Kite", ["pickup"]),
  content(EntityTypeId.WHIRLWIND, "Whirlwind", ["flight-entry"]),
  content(EntityTypeId.LANDING, "Landing", ["flight-landing"]),
  content(EntityTypeId.GOLDEN_CARROT, "Golden Carrot", ["collectible"]),
  content(EntityTypeId.BONUS_COIN, "Bonus Coin", ["collectible"]),
  ...[1, 2, 3, 4, 5, 6].map((index) =>
    content(EntityTypeId[`FENCE_${index}` as keyof typeof EntityTypeId], `Fence ${index}`, ["blocking"]),
  ),
];

export const originalEntityDefinitions: readonly EntityDefinition[] = [
  ...surfaces,
  ...covers,
  ...contents,
];
