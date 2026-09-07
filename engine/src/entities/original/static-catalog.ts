import { EntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import {
  CONTENT_STACK_ORDER,
  COVER_STACK_ORDER,
  namedCell,
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
  atlas: ReturnType<typeof namedCell>,
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
  atlas: ReturnType<typeof namedCell>,
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
  atlas: ReturnType<typeof namedCell>,
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
  surface(EntityTypeId.START, "Start", namedCell("start")),
  surface(
    EntityTypeId.SHOVEL_CLEARED_GROUND,
    "Shovel Cleared Ground",
    namedCell("shovel-cleared-ground"),
    ["walkable"],
    false,
  ),
  surface(EntityTypeId.EXIT, "Exit", namedCell("exit"), [
    "walkable",
    "exit",
    "requires-unmounted-reach",
  ]),
  surface(EntityTypeId.SHOP_DREAM, "Dream Shop", namedCell("shop-dream")),
  surface(EntityTypeId.SHOP_CLOUD9, "Cloud 9 Shop", namedCell("shop-cloud9")),
  surface(EntityTypeId.SHOP_SUPER_KEY, "Super Key Shop", namedCell("shop-super-key")),
  surface(EntityTypeId.SHOP_STEREO, "Stereo Shop", namedCell("shop-stereo")),
  surface(EntityTypeId.SHOP_MUSIC, "Music Shop", namedCell("shop-music")),
  surface(EntityTypeId.SHOP_SPEED_SHOES, "Speed Shoes Shop", namedCell("shop-speed-shoes")),
  surface(EntityTypeId.SHOP_COIN_RADAR, "Coin Radar Shop", namedCell("shop-coin-radar")),
  surface(EntityTypeId.SHOP_EMPTY, "Empty Shop", namedCell("shop-empty")),
  surface(
    EntityTypeId.SHOVEL_PICKUP,
    "Shovel Pickup",
    namedCell("shovel-pickup"),
    ["walkable", "pickup"],
  ),
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
  staticEntity(snowDefinition, namedCell("snow")),
  staticEntity(highGrassDefinition, namedCell("high-grass")),
  staticEntity(highGrassObjectiveDefinition, namedCell("high-grass-objective")),
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
  staticEntity(consumedCarrotDefinition, namedCell("carrot-consumed")),
  staticEntity(carrotDefinition, namedCell("carrot")),
  staticEntity(emptyEggNestDefinition, namedCell("egg-nest-empty"), [
    { behavior: fillEggNestOnLeave },
  ]),
  staticEntity(filledEggNestDefinition, namedCell("egg-nest-filled")),
  runtimeOnlyContent(
    EntityTypeId.BEANSTALK_TIP,
    "Beanstalk Tip",
    namedCell("beanstalk-tip"),
    [
      "terrain-overlay",
      "climbable",
      "walkable",
      "mower-conditional-overlay",
    ],
  ),
  content(EntityTypeId.BEAN, "Bean", namedCell("bean"), ["pickup"]),
  runtimeOnlyContent(EntityTypeId.WINDMILL_UP, "Windmill Up", namedCell("windmill-up"), ["blocking", "windmill"]),
  runtimeOnlyContent(EntityTypeId.WINDMILL_DOWN, "Windmill Down", namedCell("windmill-down"), ["blocking", "windmill"]),
  runtimeOnlyContent(EntityTypeId.WINDMILL_LEFT, "Windmill Left", namedCell("windmill-left"), ["blocking", "windmill"]),
  runtimeOnlyContent(EntityTypeId.WINDMILL_RIGHT, "Windmill Right", namedCell("windmill-right"), ["blocking", "windmill"]),
  runtimeOnlyContent(
    EntityTypeId.PLANK_CRUMBLING,
    "Crumbling Plank",
    namedCell("plank-crumbling-1"),
    ["blocking"],
  ),
  runtimeOnlyContent(
    EntityTypeId.PLANK_FRAGMENT,
    "Plank Fragment",
    namedCell("plank-crumbling-2"),
    ["blocking"],
  ),
  content(EntityTypeId.GAS, "Gas", namedCell("gas"), ["pickup"]),
  runtimeOnlyContent(
    EntityTypeId.BEANSTALK_MID,
    "Beanstalk Mid",
    namedCell("beanstalk-middle"),
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
    namedCell("beanstalk-base"),
    ["climbable"],
  ),
  runtimeOnlyContent(EntityTypeId.BEAN_SPROUT, "Bean Sprout", namedCell("bean-sprout")),
  content(EntityTypeId.KITE, "Kite", namedCell("kite"), ["pickup"]),
  content(
    EntityTypeId.GOLDEN_CARROT,
    "Golden Carrot",
    namedCell("golden-carrot"),
    ["collectible", "golden-carrot"],
  ),
  content(
    EntityTypeId.BONUS_COIN,
    "Bonus Coin",
    namedCell("bonus-coin"),
    ["collectible", "bonus-coin"],
  ),
];
