import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
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
  onLeave({ actor, self, query, commands }) {
    if (
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return;
    const source = self.entity;
    commands.destroy(source.id);
    commands.spawn({
      type: EntityTypeId.EGG_NEST_FILLED,
      x: source.anchor.x,
      y: source.anchor.y,
      ...(source.direction ? { direction: source.direction } : {}),
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
  palette = true,
): EntityModule {
  return staticEntity(
    {
      type,
      traits,
      ...(palette ? {} : { authoring: { palette: false } }),
      layer: "surface",
      stackOrder: SURFACE_STACK_ORDER,
      presentation: { name },
    },
    atlas,
  );
}

function runtimeOnlyContent(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof objectCell>,
  traits: EntityModuleDefinition["traits"] = [],
): EntityModule {
  const module = content(type, name, atlas, traits);
  return {
    ...module,
    authoring: { palette: false },
  };
}

function content(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof objectCell>,
  traits: EntityModuleDefinition["traits"] = [],
): EntityModule {
  return staticEntity(
    {
      type,
      traits,
      layer: "object",
      stackOrder: CONTENT_STACK_ORDER,
      presentation: { name },
    },
    atlas,
  );
}

export const staticSurfaceModules: readonly EntityModule[] = [
  surface(EntityTypeId.GROUND_A, "Ground A", cell(14, 5), ["walkable"], false),
  surface(EntityTypeId.GROUND_B, "Ground B", cell(15, 5), ["walkable"], false),
  surface(EntityTypeId.GROUND_C, "Ground C", cell(0, 9), ["walkable"], false),
  surface(EntityTypeId.GROUND_D, "Ground D", cell(1, 9), ["walkable"], false),
  surface(EntityTypeId.START, "Start", cell(5, 9)),
  surface(
    EntityTypeId.SHOVEL_CLEARED_GROUND,
    "Shovel Cleared Ground",
    cell(12, 7),
    ["walkable"],
    false,
  ),
  surface(EntityTypeId.EXIT, "Exit", cell(6, 9), [
    "walkable",
    "exit",
    "requires-unmounted-reach",
  ]),
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
  surface(EntityTypeId.WATER_ANIMATED, "Animated Water", cell(6, 5), ["water", "bean-growth-space"], false),
  surface(EntityTypeId.WATER_VARIANT_1, "Water Variant 1", cell(11, 5), ["water", "waterfall", "bean-growth-space"], false),
  surface(EntityTypeId.WATER_VARIANT_2, "Water Variant 2", cell(12, 5), ["water", "waterfall", "bean-growth-space"], false),
  surface(EntityTypeId.WATER_VARIANT_3, "Water Variant 3", cell(13, 5), ["water", "waterfall", "bean-growth-space"], false),
];

const snowDefinition: EntityModuleDefinition = {
  type: EntityTypeId.SNOW,
  traits: ["snow", "shovelable", "blocking", "bean-growth-space"],
  layer: "cover",
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "Snow" },
};

const highGrassDefinition: EntityModuleDefinition = {
  type: EntityTypeId.HIGH_GRASS,
  traits: ["mowable", "blocking"],
  layer: "cover",
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass" },
};

const highGrassObjectiveDefinition: EntityModuleDefinition = {
  type: EntityTypeId.HIGH_GRASS_OBJECTIVE,
  traits: ["mowable", "blocking", "hidden-objective"],
  layer: "cover",
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass Objective" },
};

export const staticCoverModules: readonly EntityModule[] = [
  staticEntity(snowDefinition, cell(13, 4)),
  staticEntity(highGrassDefinition, cell(7, 12)),
  staticEntity(highGrassObjectiveDefinition, cell(8, 12)),
];

const consumedCarrotDefinition: EntityModuleDefinition = {
  type: EntityTypeId.CONSUMED_CARROT,
  authoring: { palette: false },
  traits: [],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Consumed Carrot" },
};
const carrotDefinition: EntityModuleDefinition = {
  type: EntityTypeId.CARROT,
  traits: ["collectible"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Carrot" },
};
const emptyEggNestDefinition: EntityModuleDefinition = {
  type: EntityTypeId.EGG_NEST_EMPTY,
  authoring: { palette: false },
  traits: ["egg-nest"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Empty Egg Nest" },
};
const filledEggNestDefinition: EntityModuleDefinition = {
  type: EntityTypeId.EGG_NEST_FILLED,
  authoring: { palette: false },
  traits: ["egg-nest", "egg", "blocking"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Filled Egg Nest" },
};

export const staticContentModules: readonly EntityModule[] = [
  staticEntity(consumedCarrotDefinition, objectCell(0)),
  staticEntity(carrotDefinition, objectCell(1)),
  staticEntity(emptyEggNestDefinition, objectCell(2), [
    { behavior: fillEggNestOnLeave },
  ]),
  staticEntity(filledEggNestDefinition, objectCell(3)),
  runtimeOnlyContent(
    EntityTypeId.BEANSTALK_TIP,
    "Beanstalk Tip",
    objectCell(5),
    [
      "terrain-overlay",
      "climbable",
      "walkable",
      "mower-conditional-overlay",
    ],
  ),
  content(EntityTypeId.BEAN, "Bean", objectCell(6), ["pickup"]),
  runtimeOnlyContent(EntityTypeId.WINDMILL_UP, "Windmill Up", objectCell(7), ["blocking", "windmill"]),
  runtimeOnlyContent(EntityTypeId.WINDMILL_DOWN, "Windmill Down", objectCell(8), ["blocking", "windmill"]),
  runtimeOnlyContent(EntityTypeId.WINDMILL_LEFT, "Windmill Left", objectCell(9), ["blocking", "windmill"]),
  runtimeOnlyContent(EntityTypeId.WINDMILL_RIGHT, "Windmill Right", objectCell(10), ["blocking", "windmill"]),
  runtimeOnlyContent(
    EntityTypeId.PLANK_CRUMBLING,
    "Crumbling Plank",
    objectCell(12),
    ["blocking"],
  ),
  runtimeOnlyContent(
    EntityTypeId.PLANK_FRAGMENT,
    "Plank Fragment",
    objectCell(13),
    ["blocking"],
  ),
  content(EntityTypeId.GAS, "Gas", objectCell(20), ["pickup"]),
  runtimeOnlyContent(
    EntityTypeId.BEANSTALK_MID,
    "Beanstalk Mid",
    objectCell(21),
    [
      "terrain-overlay",
      "climbable",
      "walkable",
      "mower-conditional-overlay",
    ],
  ),
  runtimeOnlyContent(
    EntityTypeId.BEANSTALK_BASE,
    "Beanstalk Base",
    objectCell(37),
    ["climbable"],
  ),
  runtimeOnlyContent(EntityTypeId.BEAN_SPROUT, "Bean Sprout", objectCell(38)),
  content(EntityTypeId.KITE, "Kite", objectCell(42), ["pickup"]),
  content(
    EntityTypeId.GOLDEN_CARROT,
    "Golden Carrot",
    objectCell(45),
    ["collectible", "golden-carrot"],
  ),
  content(
    EntityTypeId.BONUS_COIN,
    "Bonus Coin",
    objectCell(47),
    ["collectible", "bonus-coin"],
  ),
];
