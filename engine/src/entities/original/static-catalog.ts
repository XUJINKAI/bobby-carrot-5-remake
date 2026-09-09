import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import { bobbyMountId } from "../player/BobbyState.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";
import {
  atlasVisual,
  CONTENT_STACK_ORDER,
  COVER_STACK_ORDER,
  originalModule,
  tileCell,
  staticEntity,
  SURFACE_STACK_ORDER,
} from "./module.js";

const fillEggNestOnLeave: Behavior = {
  id: "fill-egg-nest-on-leave",
  onLeave({ actor, self, query, commands }) {
    if (
      self.entity.state?.filled === true ||
      !query.entityHasTrait(actor.id, "player") ||
      bobbyMountId(actor.state) !== null
    )
      return;
    const source = self.entity;
    commands.destroy(source.id);
    commands.spawn({
      type: MapEntityTypeId.EGG,
      x: source.anchor.x,
      y: source.anchor.y,
      state: { filled: true },
      instanceTraits: ["filled-egg", "blocking"],
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
  surface(MapEntityTypeId.START, "Start", tileCell(MapEntityTypeId.START)),
  surface(
    RuntimeEntityTypeId.SHOVEL_CLEARED_GROUND,
    "Shovel Cleared Ground",
    tileCell("snow-cloud", { fields: { variant: "ts-8-13" } }),
    ["walkable"],
    false,
  ),
  surface(MapEntityTypeId.EXIT, "Exit", tileCell(MapEntityTypeId.EXIT), [
    "walkable",
    "exit",
    "reach-all-players",
    "requires-unmounted-reach",
  ]),
  surface(
    MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    "Dream Machine Ticket",
    tileCell(MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET),
  ),
  surface(
    MapEntityTypeId.SHOP_CLOUD9_TICKET,
    "Cloud 9 Ticket",
    tileCell(MapEntityTypeId.SHOP_CLOUD9_TICKET),
  ),
  surface(
    MapEntityTypeId.SHOP_SUPER_KEY,
    "Super Key",
    tileCell(MapEntityTypeId.SHOP_SUPER_KEY),
  ),
  surface(
    MapEntityTypeId.SHOP_STEREO_SYSTEM,
    "Stereo System",
    tileCell(MapEntityTypeId.SHOP_STEREO_SYSTEM),
  ),
  surface(
    MapEntityTypeId.SHOP_EXTRA_MUSIC,
    "Extra Music",
    tileCell(MapEntityTypeId.SHOP_EXTRA_MUSIC),
  ),
  surface(
    MapEntityTypeId.SHOP_SPEED_SHOES,
    "Speed Shoes",
    tileCell(MapEntityTypeId.SHOP_SPEED_SHOES),
  ),
  surface(
    MapEntityTypeId.SHOP_COIN_RADAR,
    "Coin Radar",
    tileCell(MapEntityTypeId.SHOP_COIN_RADAR),
  ),
  surface(
    MapEntityTypeId.SHOP_EMPTY,
    "Empty Shop",
    tileCell(MapEntityTypeId.SHOP_EMPTY),
  ),
  surface(
    MapEntityTypeId.SHOVEL_PICKUP,
    "Shovel Pickup",
    tileCell(MapEntityTypeId.SHOVEL_PICKUP),
    ["walkable", "pickup"],
  ),
];

const snowDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.SNOW,
  traits: ["snow", "shovelable", "blocking", "bean-growth-space"],
  layer: "cover",
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "Snow" },
};

const highGrassDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.HIGH_GRASS,
  traits: ["mowable", "blocking"],
  layer: "cover",
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass" },
};

export const staticCoverModules: readonly EntityModule[] = [
  staticEntity(snowDefinition, tileCell(MapEntityTypeId.SNOW)),
  staticEntity(highGrassDefinition, tileCell(MapEntityTypeId.HIGH_GRASS)),
];

const carrotDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.CARROT,
  traits: ["collectible"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Carrot" },
};
const eggDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.EGG,
  traits: ["egg-nest"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Egg" },
};

const egg = originalModule(
  eggDefinition,
  atlasVisual(eggDefinition, (context) =>
    context.entity.state?.filled === true
      ? tileCell(MapEntityTypeId.EGG, { phase: "filled" })
      : tileCell(MapEntityTypeId.EGG),
  ),
  [{ behavior: fillEggNestOnLeave }],
);

const beanstalkTraits = [
  "terrain-overlay",
  "climbable",
  "walkable",
  "mower-conditional-overlay",
] as const;

const windmillDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.WINDMILL,
  traits: ["blocking", "windmill"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Windmill" },
};

const windmill = originalModule(
  windmillDefinition,
  atlasVisual(windmillDefinition, (context) =>
    tileCell(MapEntityTypeId.WINDMILL, {
      fields: { direction: context.entity.direction ?? "right" },
    }),
  ),
);

export const staticContentModules: readonly EntityModule[] = [
  staticEntity(carrotDefinition, tileCell(MapEntityTypeId.CARROT)),
  egg,
  {
    ...content(
      MapEntityTypeId.BEANSTALK,
      "Beanstalk",
      tileCell(MapEntityTypeId.BEANSTALK, { role: "tip" }),
      beanstalkTraits,
    ),
    authoring: { palette: false },
  },
  content(MapEntityTypeId.BEAN, "Bean", tileCell(MapEntityTypeId.BEAN), ["pickup"]),
  windmill,
  content(MapEntityTypeId.GAS, "Gas", tileCell(MapEntityTypeId.GAS), ["pickup"]),
  runtimeOnlyContent(
    RuntimeEntityTypeId.BEANSTALK_MID,
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
    RuntimeEntityTypeId.BEANSTALK_BASE,
    "Beanstalk Base",
    tileCell("beanstalk", { role: "base" }),
    ["climbable"],
  ),
  runtimeOnlyContent(
    RuntimeEntityTypeId.BEAN_SPROUT,
    "Bean Sprout",
    tileCell("beanstalk", { phase: "sprout" }),
  ),
  content(MapEntityTypeId.KITE, "Kite", tileCell(MapEntityTypeId.KITE), ["pickup"]),
  content(
    MapEntityTypeId.GOLDEN_CARROT,
    "Golden Carrot",
    tileCell(MapEntityTypeId.GOLDEN_CARROT),
    ["collectible", "golden-carrot"],
  ),
  content(
    MapEntityTypeId.BONUS_COIN,
    "Bonus Coin",
    tileCell(MapEntityTypeId.BONUS_COIN),
    ["collectible", "bonus-coin"],
  ),
];
