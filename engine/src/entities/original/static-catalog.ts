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
  tileAnimationCell,
  tileCell,
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
      type: EntityTypeId.EGG_FILLED,
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
  atlas: ReturnType<typeof tileCell>,
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
  atlas: ReturnType<typeof tileCell>,
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
  atlas: ReturnType<typeof tileCell>,
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
  surface(EntityTypeId.START, "Start", tileCell(EntityTypeId.START)),
  surface(
    EntityTypeId.SHOVEL_CLEARED_GROUND,
    "Shovel Cleared Ground",
    tileCell("snow-cloud", { fields: { variant: "ts-8-13" } }),
    ["walkable"],
    false,
  ),
  surface(EntityTypeId.EXIT, "Exit", tileCell(EntityTypeId.EXIT), [
    "walkable",
    "exit",
    "requires-unmounted-reach",
  ]),
  surface(
    EntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    "Dream Machine Ticket",
    tileCell(EntityTypeId.SHOP_DREAM_MACHINE_TICKET),
  ),
  surface(
    EntityTypeId.SHOP_CLOUD9_TICKET,
    "Cloud 9 Ticket",
    tileCell(EntityTypeId.SHOP_CLOUD9_TICKET),
  ),
  surface(
    EntityTypeId.SHOP_SUPER_KEY,
    "Super Key",
    tileCell(EntityTypeId.SHOP_SUPER_KEY),
  ),
  surface(
    EntityTypeId.SHOP_STEREO_SYSTEM,
    "Stereo System",
    tileCell(EntityTypeId.SHOP_STEREO_SYSTEM),
  ),
  surface(
    EntityTypeId.SHOP_EXTRA_MUSIC,
    "Extra Music",
    tileCell(EntityTypeId.SHOP_EXTRA_MUSIC),
  ),
  surface(
    EntityTypeId.SHOP_SPEED_SHOES,
    "Speed Shoes",
    tileCell(EntityTypeId.SHOP_SPEED_SHOES),
  ),
  surface(
    EntityTypeId.SHOP_COIN_RADAR,
    "Coin Radar",
    tileCell(EntityTypeId.SHOP_COIN_RADAR),
  ),
  surface(
    EntityTypeId.SHOP_EMPTY,
    "Empty Shop",
    tileCell(EntityTypeId.SHOP_EMPTY),
  ),
  surface(
    EntityTypeId.SHOVEL_PICKUP,
    "Shovel Pickup",
    tileCell(EntityTypeId.SHOVEL_PICKUP),
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
  authoring: { palette: false },
  traits: ["mowable", "blocking", "hidden-objective"],
  layer: "cover",
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass Objective" },
};

export const staticCoverModules: readonly EntityModule[] = [
  staticEntity(snowDefinition, tileCell(EntityTypeId.SNOW)),
  staticEntity(highGrassDefinition, tileCell(EntityTypeId.HIGH_GRASS)),
  staticEntity(
    highGrassObjectiveDefinition,
    tileCell(EntityTypeId.HIGH_GRASS, { phase: "objective" }),
  ),
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
  type: EntityTypeId.EGG_EMPTY,
  authoring: { palette: false },
  traits: ["egg-nest"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Empty Egg Nest" },
};
const filledEggNestDefinition: EntityModuleDefinition = {
  type: EntityTypeId.EGG_FILLED,
  authoring: { palette: false },
  traits: ["egg-nest", "egg", "blocking"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Filled Egg Nest" },
};

export const staticContentModules: readonly EntityModule[] = [
  staticEntity(
    consumedCarrotDefinition,
    tileCell(EntityTypeId.CARROT, { phase: "consumed" }),
  ),
  staticEntity(carrotDefinition, tileCell(EntityTypeId.CARROT)),
  staticEntity(emptyEggNestDefinition, tileCell("egg"), [
    { behavior: fillEggNestOnLeave },
  ]),
  staticEntity(filledEggNestDefinition, tileCell("egg", { phase: "filled" })),
  runtimeOnlyContent(
    EntityTypeId.BEANSTALK_TIP,
    "Beanstalk Tip",
    tileCell("beanstalk", { role: "tip" }),
    [
      "terrain-overlay",
      "climbable",
      "walkable",
      "mower-conditional-overlay",
    ],
  ),
  content(EntityTypeId.BEAN, "Bean", tileCell(EntityTypeId.BEAN), ["pickup"]),
  runtimeOnlyContent(
    EntityTypeId.WINDMILL_UP,
    "Windmill Up",
    tileCell("windmill", { fields: { direction: "up" } }),
    ["blocking", "windmill"],
  ),
  runtimeOnlyContent(
    EntityTypeId.WINDMILL_DOWN,
    "Windmill Down",
    tileCell("windmill", { fields: { direction: "down" } }),
    ["blocking", "windmill"],
  ),
  runtimeOnlyContent(
    EntityTypeId.WINDMILL_LEFT,
    "Windmill Left",
    tileCell("windmill", { fields: { direction: "left" } }),
    ["blocking", "windmill"],
  ),
  runtimeOnlyContent(
    EntityTypeId.WINDMILL_RIGHT,
    "Windmill Right",
    tileCell("windmill", { fields: { direction: "right" } }),
    ["blocking", "windmill"],
  ),
  runtimeOnlyContent(
    EntityTypeId.PLANK_CRUMBLING,
    "Crumbling Plank",
    tileAnimationCell(EntityTypeId.PLANK, "crumbling", 1),
    ["blocking"],
  ),
  runtimeOnlyContent(
    EntityTypeId.PLANK_FRAGMENT,
    "Plank Fragment",
    tileAnimationCell(EntityTypeId.PLANK, "crumbling", 2),
    ["blocking"],
  ),
  content(EntityTypeId.GAS, "Gas", tileCell(EntityTypeId.GAS), ["pickup"]),
  runtimeOnlyContent(
    EntityTypeId.BEANSTALK_MID,
    "Beanstalk Mid",
    tileCell("beanstalk", { role: "middle" }),
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
    tileCell("beanstalk", { role: "base" }),
    ["climbable"],
  ),
  runtimeOnlyContent(
    EntityTypeId.BEAN_SPROUT,
    "Bean Sprout",
    tileCell("beanstalk", { phase: "sprout" }),
  ),
  content(EntityTypeId.KITE, "Kite", tileCell(EntityTypeId.KITE), ["pickup"]),
  content(
    EntityTypeId.GOLDEN_CARROT,
    "Golden Carrot",
    tileCell(EntityTypeId.GOLDEN_CARROT),
    ["collectible", "golden-carrot"],
  ),
  content(
    EntityTypeId.BONUS_COIN,
    "Bonus Coin",
    tileCell(EntityTypeId.BONUS_COIN),
    ["collectible", "bonus-coin"],
  ),
];
