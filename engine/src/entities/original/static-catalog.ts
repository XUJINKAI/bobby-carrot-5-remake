import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityBehaviorBinding,
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  collectBehavior,
  mowerConditionalOverlayBehavior,
  mowableBehavior,
  pickupBehavior,
  requiresUnmountedReachBehavior,
  shovelableBehavior,
} from "../behaviorLibrary.js";
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
      !query.entityHasFact(actor.id, "player") ||
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
  facts: EntityModuleDefinition["facts"] = ["walkable"],
  palette = true,
  mechanisms: readonly string[] = [],
  behaviorBindings: readonly EntityBehaviorBinding[] = [],
): EntityModule {
  return staticEntity(
    {
      type,
      facts,
      mechanisms,
      ...(palette ? {} : { authoring: { palette: false } }),
      layer: "surface",
      stackOrder: SURFACE_STACK_ORDER,
      presentation: { name },
    },
    atlas,
    behaviorBindings,
  );
}

function runtimeOnlyContent(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof tileCell>,
  facts: EntityModuleDefinition["facts"] = [],
  behaviorBindings: readonly EntityBehaviorBinding[] = [],
): EntityModule {
  const module = content(type, name, atlas, facts, behaviorBindings);
  return {
    ...module,
    authoring: { palette: false },
  };
}

function content(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof tileCell>,
  facts: EntityModuleDefinition["facts"] = [],
  behaviorBindings: readonly EntityBehaviorBinding[] = [],
): EntityModule {
  return staticEntity(
    {
      type,
      facts,
      layer: "object",
      stackOrder: CONTENT_STACK_ORDER,
      presentation: { name },
    },
    atlas,
    behaviorBindings,
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
    "reach-all-players",
  ], true, [], [{ behavior: requiresUnmountedReachBehavior }]),
  surface(
    MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    "Dream Machine Ticket",
    tileCell(MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET),
    ["blocking"],
    true,
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_CLOUD9_TICKET,
    "Cloud 9 Ticket",
    tileCell(MapEntityTypeId.SHOP_CLOUD9_TICKET),
    ["blocking"],
    true,
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_STEREO_SYSTEM,
    "Stereo System",
    tileCell(MapEntityTypeId.SHOP_STEREO_SYSTEM),
    ["blocking"],
    true,
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_EXTRA_MUSIC,
    "Extra Music",
    tileCell(MapEntityTypeId.SHOP_EXTRA_MUSIC),
    ["blocking"],
    true,
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_SPEED_SHOES,
    "Speed Shoes",
    tileCell(MapEntityTypeId.SHOP_SPEED_SHOES),
    ["blocking"],
    true,
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_COIN_RADAR,
    "Coin Radar",
    tileCell(MapEntityTypeId.SHOP_COIN_RADAR),
    ["blocking"],
    true,
    ["object-interaction", "dialog"],
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
    ["walkable"],
    true,
    [],
    [{ behavior: pickupBehavior }],
  ),
];

const snowDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.SNOW,
  facts: ["blocking", "bean-growth-space"],
  layer: "cover",
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "Snow" },
};

const highGrassDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.HIGH_GRASS,
  facts: ["blocking"],
  layer: "cover",
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass" },
};

export const staticCoverModules: readonly EntityModule[] = [
  staticEntity(snowDefinition, tileCell(MapEntityTypeId.SNOW), [
    { behavior: shovelableBehavior },
  ]),
  staticEntity(highGrassDefinition, tileCell(MapEntityTypeId.HIGH_GRASS), [
    { behavior: mowableBehavior },
  ]),
];

const carrotDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.CARROT,
  facts: ["collectible"],
  layer: "object",
  stackOrder: CONTENT_STACK_ORDER,
  presentation: { name: "Carrot" },
};
const eggDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.EGG,
  facts: ["egg-nest"],
  resolvePresenceFacts({ entity }) {
    return entity.state?.filled === true ? ["filled-egg", "blocking"] : [];
  },
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

const beanstalkFacts = [
  "terrain-overlay",
  "climbable",
  "walkable",
] as const;

const windmillDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.WINDMILL,
  facts: ["blocking"],
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
  staticEntity(carrotDefinition, tileCell(MapEntityTypeId.CARROT), [
    { behavior: collectBehavior },
  ]),
  runtimeOnlyContent(
    RuntimeEntityTypeId.CONSUMED_CARROT,
    "Consumed Carrot",
    tileCell(MapEntityTypeId.CARROT, { phase: "consumed" }),
  ),
  egg,
  {
    ...content(
      MapEntityTypeId.BEANSTALK,
      "Beanstalk",
      tileCell(MapEntityTypeId.BEANSTALK, { role: "tip" }),
      beanstalkFacts,
      [{ behavior: mowerConditionalOverlayBehavior }],
    ),
    authoring: { palette: false },
  },
  content(MapEntityTypeId.BEAN, "Bean", tileCell(MapEntityTypeId.BEAN), [], [
    { behavior: pickupBehavior },
  ]),
  windmill,
  content(MapEntityTypeId.GAS, "Gas", tileCell(MapEntityTypeId.GAS), [], [
    { behavior: pickupBehavior },
  ]),
  runtimeOnlyContent(
    RuntimeEntityTypeId.BEANSTALK_MID,
    "Beanstalk Mid",
    tileCell("beanstalk", { role: "middle" }),
    [
      "terrain-overlay",
      "climbable",
      "walkable",
    ],
    [{ behavior: mowerConditionalOverlayBehavior }],
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
  content(MapEntityTypeId.KITE, "Kite", tileCell(MapEntityTypeId.KITE), [], [
    { behavior: pickupBehavior },
  ]),
  content(
    MapEntityTypeId.GOLDEN_CARROT,
    "Golden Carrot",
    tileCell(MapEntityTypeId.GOLDEN_CARROT),
    ["collectible"],
    [{ behavior: collectBehavior }],
  ),
  content(
    MapEntityTypeId.BONUS_COIN,
    "Bonus Coin",
    tileCell(MapEntityTypeId.BONUS_COIN),
    ["collectible"],
    [{ behavior: collectBehavior }],
  ),
];
