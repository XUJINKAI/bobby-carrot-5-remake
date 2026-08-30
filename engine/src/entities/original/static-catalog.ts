import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  cell,
  CONTENT_STACK_ORDER,
  COVER_STACK_ORDER,
  objectCell,
  staticEntity,
  SURFACE_STACK_ORDER,
} from "./module.js";

const fillEggNestOnLeave: Behavior = {
  id: "fill-egg-nest-on-leave",
  onLeave({ self, commands }) {
    const source = self.entity;
    commands.destroy(source.id);
    commands.spawn({
      type: EntityTypeId.EGG_NEST_FILLED,
      x: source.anchor.x,
      y: source.anchor.y,
      ...(source.direction ? { direction: source.direction } : {}),
      ...(source.properties
        ? { properties: structuredClone(source.properties) }
        : {}),
      ...(source.state ? { state: structuredClone(source.state) } : {}),
      ...(source.instanceTraits ? { traits: [...source.instanceTraits] } : {}),
    });
    commands.emit({
      type: "fill-egg-nest",
      entityId: source.id,
      x: self.presence.cell.x,
      y: self.presence.cell.y,
    });
  },
};

function surface(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof cell>,
  traits: EntityModuleDefinition["traits"] = ["walkable"],
  category = "地表",
): EntityModule {
  const definition: EntityModuleDefinition = {
    type,
    traits,
    stackOrder: SURFACE_STACK_ORDER,
    presentation: { name, category },
    authoring: {
      palette: true,
      category,
      replaceGroup: "surface",
    },
  };
  return staticEntity(definition, atlas);
}

function content(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof objectCell>,
  traits: EntityModuleDefinition["traits"] = [],
  authoring: EntityModuleDefinition["authoring"] = {
    palette: true,
    category: "实体",
  },
): EntityModule {
  const definition: EntityModuleDefinition = {
    type,
    traits,
    stackOrder: CONTENT_STACK_ORDER,
    presentation: { name, category: "实体" },
    authoring,
  };
  return staticEntity(definition, atlas);
}

export const staticSurfaceModules: readonly EntityModule[] = [
  surface(EntityTypeId.GROUND_A, "Ground A", cell(14, 5)),
  surface(EntityTypeId.GROUND_B, "Ground B", cell(15, 5)),
  surface(EntityTypeId.GROUND_C, "Ground C", cell(0, 9)),
  surface(EntityTypeId.GROUND_D, "Ground D", cell(1, 9)),
  surface(EntityTypeId.START, "Start", cell(5, 9)),
  surface(
    EntityTypeId.SHOVEL_CLEARED_GROUND,
    "Shovel Cleared Ground",
    cell(12, 7),
  ),
  surface(EntityTypeId.EXIT, "Exit", cell(6, 9), ["walkable", "exit"], "目标"),
  surface(
    EntityTypeId.ICE,
    "Ice",
    cell(4, 9),
    ["walkable", "forced-movement"],
  ),
  surface(EntityTypeId.SHOP_DREAM, "Dream Shop", cell(7, 9)),
  surface(EntityTypeId.SHOP_CLOUD9, "Cloud 9 Shop", cell(8, 9)),
  surface(EntityTypeId.SHOP_SUPER_KEY, "Super Key Shop", cell(9, 9)),
  surface(EntityTypeId.SHOP_STEREO, "Stereo Shop", cell(10, 9)),
  surface(EntityTypeId.SHOP_MUSIC, "Music Shop", cell(11, 9)),
  surface(EntityTypeId.SHOP_SPEED_SHOES, "Speed Shoes Shop", cell(12, 9)),
  surface(EntityTypeId.SHOP_COIN_RADAR, "Coin Radar Shop", cell(13, 9)),
  surface(EntityTypeId.SHOP_UNAVAILABLE, "Unavailable Shop", cell(14, 9)),
  surface(
    EntityTypeId.SHOVEL_PICKUP,
    "Shovel Pickup",
    cell(15, 9),
    ["walkable", "pickup"],
  ),
  surface(EntityTypeId.MOWER_PARKING, "Mower Parking", cell(0, 10)),
  surface(EntityTypeId.WATER, "Water", cell(5, 5), ["water"], "水域"),
  surface(
    EntityTypeId.WATER_ANIMATED,
    "Animated Water",
    cell(6, 5),
    ["water"],
    "水域",
  ),
  surface(
    EntityTypeId.WATER_VARIANT_1,
    "Water Variant 1",
    cell(11, 5),
    ["water"],
    "水域",
  ),
  surface(
    EntityTypeId.WATER_VARIANT_2,
    "Water Variant 2",
    cell(12, 5),
    ["water"],
    "水域",
  ),
  surface(
    EntityTypeId.WATER_VARIANT_3,
    "Water Variant 3",
    cell(13, 5),
    ["water"],
    "水域",
  ),
];

const snowDefinition: EntityModuleDefinition = {
  type: EntityTypeId.SNOW,
  traits: ["snow", "shovelable", "blocking"],
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "Snow", category: "覆盖" },
  authoring: {
    palette: true,
    category: "覆盖",
    replaceGroup: "cover",
  },
};

const highGrassDefinition: EntityModuleDefinition = {
  type: EntityTypeId.HIGH_GRASS,
  traits: ["mowable", "blocking"],
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass", category: "覆盖" },
  authoring: {
    palette: true,
    category: "覆盖",
    replaceGroup: "cover",
  },
};

const highGrassObjectiveDefinition: EntityModuleDefinition = {
  type: EntityTypeId.HIGH_GRASS_OBJECTIVE,
  traits: ["mowable", "blocking", "hidden-objective"],
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass Objective", category: "覆盖" },
  authoring: {
    palette: true,
    category: "覆盖",
    replaceGroup: "cover",
  },
};

export const staticCoverModules: readonly EntityModule[] = [
  staticEntity(snowDefinition, cell(13, 4)),
  staticEntity(highGrassDefinition, cell(7, 12)),
  staticEntity(highGrassObjectiveDefinition, cell(8, 12)),
];

const consumedCarrotDefinition: EntityModuleDefinition = {
  type: EntityTypeId.CONSUMED_CARROT,
  traits: [],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Consumed Carrot", category: "实体" },
  authoring: { palette: false, category: "内部" },
};
const carrotDefinition: EntityModuleDefinition = {
  type: EntityTypeId.CARROT,
  traits: ["collectible"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Carrot", category: "目标" },
  authoring: { palette: true, category: "目标", replaceGroup: "item" },
};
const emptyEggNestDefinition: EntityModuleDefinition = {
  type: EntityTypeId.EGG_NEST_EMPTY,
  traits: ["egg-nest"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Empty Egg Nest", category: "目标" },
  authoring: { palette: true, category: "目标", replaceGroup: "item" },
};
const filledEggNestDefinition: EntityModuleDefinition = {
  type: EntityTypeId.EGG_NEST_FILLED,
  traits: ["egg-nest", "egg", "blocking"],
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Filled Egg Nest", category: "实体" },
  authoring: { palette: true, category: "实体", replaceGroup: "item" },
};

export const staticContentModules: readonly EntityModule[] = [
  staticEntity(consumedCarrotDefinition, objectCell(0)),
  staticEntity(carrotDefinition, objectCell(1)),
  staticEntity(emptyEggNestDefinition, objectCell(2), [
    { behavior: fillEggNestOnLeave },
  ]),
  staticEntity(filledEggNestDefinition, objectCell(3)),
  content(EntityTypeId.LOCK, "Lock", objectCell(4), ["blocking", "gate"]),
  content(
    EntityTypeId.BEANSTALK_TIP,
    "Beanstalk Tip",
    objectCell(5),
    ["terrain-overlay", "climbable", "walkable"],
  ),
  content(EntityTypeId.BEAN, "Bean", objectCell(6), ["pickup"]),
  content(EntityTypeId.WINDMILL_UP, "Windmill Up", objectCell(7), ["blocking"]),
  content(EntityTypeId.WINDMILL_DOWN, "Windmill Down", objectCell(8), ["blocking"]),
  content(EntityTypeId.WINDMILL_LEFT, "Windmill Left", objectCell(9), ["blocking"]),
  content(EntityTypeId.WINDMILL_RIGHT, "Windmill Right", objectCell(10), ["blocking"]),
  content(EntityTypeId.PLANK, "Plank", objectCell(11), ["terrain-overlay", "walkable"]),
  content(
    EntityTypeId.PLANK_CRUMBLING,
    "Crumbling Plank",
    objectCell(12),
    ["terrain-overlay", "walkable", "blocking"],
    { palette: false, category: "内部" },
  ),
  content(
    EntityTypeId.PLANK_FRAGMENT,
    "Plank Fragment",
    objectCell(13),
    ["blocking"],
    { palette: false, category: "内部" },
  ),
  content(EntityTypeId.MOWER, "Mower", objectCell(19), ["vehicle"]),
  content(EntityTypeId.GAS, "Gas", objectCell(20), ["pickup"]),
  content(
    EntityTypeId.BEANSTALK_MID,
    "Beanstalk Mid",
    objectCell(21),
    ["terrain-overlay", "climbable", "walkable"],
  ),
  content(EntityTypeId.BEAN_FIELD, "Bean Field", objectCell(22)),
  content(EntityTypeId.CLOUD_RED, "Red Cloud", objectCell(23), ["vehicle", "cloud"]),
  content(
    EntityTypeId.CLOUD_PURPLE,
    "Purple Cloud",
    objectCell(24),
    ["vehicle", "cloud"],
  ),
  content(EntityTypeId.CLOUD_GREEN, "Green Cloud", objectCell(25), ["vehicle", "cloud"]),
  content(EntityTypeId.LEAF, "Leaf", objectCell(35), ["vehicle", "leaf"]),
  content(
    EntityTypeId.CRUMBLY_ROCK,
    "Crumbly Rock",
    objectCell(36),
    ["dragon-fire-blocking"],
  ),
  content(
    EntityTypeId.BEANSTALK_BASE,
    "Beanstalk Base",
    objectCell(37),
    ["terrain-overlay", "climbable", "walkable"],
  ),
  content(
    EntityTypeId.BEAN_SPROUT,
    "Bean Sprout",
    objectCell(38),
    [],
    { palette: false, category: "内部" },
  ),
  content(EntityTypeId.CLOUD_GRID_RED, "Red Cloud Grid", objectCell(39)),
  content(EntityTypeId.CLOUD_GRID_PURPLE, "Purple Cloud Grid", objectCell(40)),
  content(EntityTypeId.CLOUD_GRID_GREEN, "Green Cloud Grid", objectCell(41)),
  content(EntityTypeId.KITE, "Kite", objectCell(42), ["pickup"]),
  content(EntityTypeId.WHIRLWIND, "Whirlwind", objectCell(43), ["flight-entry"]),
  content(EntityTypeId.LANDING, "Landing", objectCell(44), ["flight-landing"]),
  content(EntityTypeId.GOLDEN_CARROT, "Golden Carrot", objectCell(45), ["collectible"]),
  content(EntityTypeId.BONUS_COIN, "Bonus Coin", objectCell(47), ["collectible"]),
];
