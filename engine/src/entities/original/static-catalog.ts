import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type { EntityModule } from "../EntityModule.js";
import {
  cell,
  objectCell,
  staticContent,
  staticCover,
  staticSurface,
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

export const staticSurfaceModules: readonly EntityModule[] = [
  staticSurface(EntityTypeId.GROUND_A, "Ground A", cell(14, 5)),
  staticSurface(EntityTypeId.GROUND_B, "Ground B", cell(15, 5)),
  staticSurface(EntityTypeId.GROUND_C, "Ground C", cell(0, 9)),
  staticSurface(EntityTypeId.GROUND_D, "Ground D", cell(1, 9)),
  staticSurface(EntityTypeId.START, "Start", cell(5, 9)),
  staticSurface(
    EntityTypeId.SHOVEL_CLEARED_GROUND,
    "Shovel Cleared Ground",
    cell(12, 7),
  ),
  staticSurface(EntityTypeId.EXIT, "Exit", cell(6, 9), ["walkable", "exit"], {
    presentation: { name: "Exit", category: "目标" },
    authoring: { palette: true, category: "目标" },
  }),
  staticSurface(
    EntityTypeId.ICE,
    "Ice",
    cell(4, 9),
    ["walkable", "forced-movement"],
  ),
  staticSurface(EntityTypeId.SHOP_DREAM, "Dream Shop", cell(7, 9)),
  staticSurface(EntityTypeId.SHOP_CLOUD9, "Cloud 9 Shop", cell(8, 9)),
  staticSurface(
    EntityTypeId.SHOP_SUPER_KEY,
    "Super Key Shop",
    cell(9, 9),
  ),
  staticSurface(EntityTypeId.SHOP_STEREO, "Stereo Shop", cell(10, 9)),
  staticSurface(EntityTypeId.SHOP_MUSIC, "Music Shop", cell(11, 9)),
  staticSurface(
    EntityTypeId.SHOP_SPEED_SHOES,
    "Speed Shoes Shop",
    cell(12, 9),
  ),
  staticSurface(
    EntityTypeId.SHOP_COIN_RADAR,
    "Coin Radar Shop",
    cell(13, 9),
  ),
  staticSurface(
    EntityTypeId.SHOP_UNAVAILABLE,
    "Unavailable Shop",
    cell(14, 9),
  ),
  staticSurface(
    EntityTypeId.SHOVEL_PICKUP,
    "Shovel Pickup",
    cell(15, 9),
    ["walkable", "pickup"],
  ),
  staticSurface(
    EntityTypeId.MOWER_PARKING,
    "Mower Parking",
    cell(0, 10),
  ),
  staticSurface(EntityTypeId.WATER, "Water", cell(5, 5), ["water"], {
    presentation: { name: "Water", category: "水域" },
    authoring: { palette: true, category: "水域" },
  }),
  staticSurface(
    EntityTypeId.WATER_ANIMATED,
    "Animated Water",
    cell(6, 5),
    ["water"],
    {
      presentation: { name: "Animated Water", category: "水域" },
      authoring: { palette: true, category: "水域" },
    },
  ),
  staticSurface(
    EntityTypeId.WATER_VARIANT_1,
    "Water Variant 1",
    cell(11, 5),
    ["water"],
    {
      presentation: { name: "Water Variant 1", category: "水域" },
      authoring: { palette: true, category: "水域" },
    },
  ),
  staticSurface(
    EntityTypeId.WATER_VARIANT_2,
    "Water Variant 2",
    cell(12, 5),
    ["water"],
    {
      presentation: { name: "Water Variant 2", category: "水域" },
      authoring: { palette: true, category: "水域" },
    },
  ),
  staticSurface(
    EntityTypeId.WATER_VARIANT_3,
    "Water Variant 3",
    cell(13, 5),
    ["water"],
    {
      presentation: { name: "Water Variant 3", category: "水域" },
      authoring: { palette: true, category: "水域" },
    },
  ),
];

export const staticCoverModules: readonly EntityModule[] = [
  staticCover(
    EntityTypeId.SNOW,
    "Snow",
    cell(13, 4),
    ["snow", "shovelable", "blocking"],
  ),
  staticCover(
    EntityTypeId.HIGH_GRASS,
    "High Grass",
    cell(7, 12),
    ["mowable", "blocking"],
  ),
  staticCover(
    EntityTypeId.HIGH_GRASS_OBJECTIVE,
    "High Grass Objective",
    cell(8, 12),
    ["mowable", "blocking", "hidden-objective"],
  ),
];

export const staticContentModules: readonly EntityModule[] = [
  staticContent(
    EntityTypeId.CONSUMED_CARROT,
    "Consumed Carrot",
    objectCell(0),
    [],
    { authoring: { palette: false, category: "内部" } },
  ),
  staticContent(
    EntityTypeId.CARROT,
    "Carrot",
    objectCell(1),
    ["collectible"],
    {
      presentation: { name: "Carrot", category: "目标" },
      authoring: {
        palette: true,
        category: "目标",
        replaceGroup: "item",
      },
    },
  ),
  staticContent(
    EntityTypeId.EGG_NEST_EMPTY,
    "Empty Egg Nest",
    objectCell(2),
    ["egg-nest"],
    {
      presentation: { name: "Empty Egg Nest", category: "目标" },
      authoring: {
        palette: true,
        category: "目标",
        replaceGroup: "item",
      },
    },
    [{ behavior: fillEggNestOnLeave }],
  ),
  staticContent(
    EntityTypeId.EGG_NEST_FILLED,
    "Filled Egg Nest",
    objectCell(3),
    ["egg-nest", "egg", "blocking"],
    {
      authoring: {
        palette: true,
        category: "实体",
        replaceGroup: "item",
      },
    },
  ),
  staticContent(EntityTypeId.LOCK, "Lock", objectCell(4), ["blocking", "gate"]),
  staticContent(
    EntityTypeId.BEANSTALK_TIP,
    "Beanstalk Tip",
    objectCell(5),
    ["terrain-overlay", "climbable", "walkable"],
  ),
  staticContent(EntityTypeId.BEAN, "Bean", objectCell(6), ["pickup"]),
  staticContent(
    EntityTypeId.WINDMILL_UP,
    "Windmill Up",
    objectCell(7),
    ["blocking"],
  ),
  staticContent(
    EntityTypeId.WINDMILL_DOWN,
    "Windmill Down",
    objectCell(8),
    ["blocking"],
  ),
  staticContent(
    EntityTypeId.WINDMILL_LEFT,
    "Windmill Left",
    objectCell(9),
    ["blocking"],
  ),
  staticContent(
    EntityTypeId.WINDMILL_RIGHT,
    "Windmill Right",
    objectCell(10),
    ["blocking"],
  ),
  staticContent(
    EntityTypeId.PLANK,
    "Plank",
    objectCell(11),
    ["terrain-overlay", "walkable"],
  ),
  staticContent(
    EntityTypeId.PLANK_CRUMBLING,
    "Crumbling Plank",
    objectCell(12),
    ["terrain-overlay", "walkable", "blocking"],
    { authoring: { palette: false, category: "内部" } },
  ),
  staticContent(
    EntityTypeId.PLANK_FRAGMENT,
    "Plank Fragment",
    objectCell(13),
    ["blocking"],
    { authoring: { palette: false, category: "内部" } },
  ),
  staticContent(EntityTypeId.MOWER, "Mower", objectCell(19), ["vehicle"]),
  staticContent(EntityTypeId.GAS, "Gas", objectCell(20), ["pickup"]),
  staticContent(
    EntityTypeId.BEANSTALK_MID,
    "Beanstalk Mid",
    objectCell(21),
    ["terrain-overlay", "climbable", "walkable"],
  ),
  staticContent(EntityTypeId.BEAN_FIELD, "Bean Field", objectCell(22)),
  staticContent(
    EntityTypeId.CLOUD_RED,
    "Red Cloud",
    objectCell(23),
    ["vehicle", "cloud"],
  ),
  staticContent(
    EntityTypeId.CLOUD_PURPLE,
    "Purple Cloud",
    objectCell(24),
    ["vehicle", "cloud"],
  ),
  staticContent(
    EntityTypeId.CLOUD_GREEN,
    "Green Cloud",
    objectCell(25),
    ["vehicle", "cloud"],
  ),
  staticContent(EntityTypeId.LEAF, "Leaf", objectCell(35), ["vehicle", "leaf"]),
  staticContent(
    EntityTypeId.CRUMBLY_ROCK,
    "Crumbly Rock",
    objectCell(36),
    ["dragon-fire-blocking"],
  ),
  staticContent(
    EntityTypeId.BEANSTALK_BASE,
    "Beanstalk Base",
    objectCell(37),
    ["terrain-overlay", "climbable", "walkable"],
  ),
  staticContent(
    EntityTypeId.BEAN_SPROUT,
    "Bean Sprout",
    objectCell(38),
    [],
    { authoring: { palette: false, category: "内部" } },
  ),
  staticContent(EntityTypeId.CLOUD_GRID_RED, "Red Cloud Grid", objectCell(39)),
  staticContent(
    EntityTypeId.CLOUD_GRID_PURPLE,
    "Purple Cloud Grid",
    objectCell(40),
  ),
  staticContent(
    EntityTypeId.CLOUD_GRID_GREEN,
    "Green Cloud Grid",
    objectCell(41),
  ),
  staticContent(EntityTypeId.KITE, "Kite", objectCell(42), ["pickup"]),
  staticContent(
    EntityTypeId.WHIRLWIND,
    "Whirlwind",
    objectCell(43),
    ["flight-entry"],
  ),
  staticContent(
    EntityTypeId.LANDING,
    "Landing",
    objectCell(44),
    ["flight-landing"],
  ),
  staticContent(
    EntityTypeId.GOLDEN_CARROT,
    "Golden Carrot",
    objectCell(45),
    ["collectible"],
  ),
  staticContent(
    EntityTypeId.BONUS_COIN,
    "Bonus Coin",
    objectCell(47),
    ["collectible"],
  ),
];
