import { MapEntityTypeId } from "@bobby/model";
import type { Behavior } from "../../world/behavior/Behavior.js";
import type {
  EntityBehaviorBinding,
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  collectBehavior,
  mowableBehavior,
  pickupBehavior,
  requiresUnmountedReachBehavior,
  shovelableBehavior,
} from "../behaviorLibrary.js";
import { carrot } from "./carrot.js";
import { egg } from "./egg.js";
import { bobbyMountId } from "../player/BobbyState.js";
import { hasBobbyBridgeAt } from "./terrain-semantics.js";
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

function surface(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof tileCell>,
  facts: EntityModuleDefinition["facts"] = ["walkable"],
  mechanisms: readonly string[] = [],
  behaviorBindings: readonly EntityBehaviorBinding[] = [],
): EntityModule {
  return staticEntity(
    {
      type,
      facts,
      mechanisms,
      stackOrder: SURFACE_STACK_ORDER,
      presentation: { name },
    },
    atlas,
    behaviorBindings,
  );
}

const bobbyBridgeOnCover: Behavior = {
  id: "bobby-bridge-on-cover",
  canEnter({ actor, self, query }) {
    if (
      query.entityHasFact(actor.id, "player") &&
      bobbyMountId(actor.state) === null &&
      hasBobbyBridgeAt(query, self.presence.cell)
    ) {
      return { passable: true, reason: "bridge-over-covered-terrain" };
    }
  },
};

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
  ),
  surface(MapEntityTypeId.EXIT, "Exit", tileCell(MapEntityTypeId.EXIT), [
    "walkable",
  ], [], [{ behavior: requiresUnmountedReachBehavior }]),
  surface(
    MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET,
    "Dream Machine Ticket",
    tileCell(MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET),
    ["blocking"],
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_CLOUD9_TICKET,
    "Cloud 9 Ticket",
    tileCell(MapEntityTypeId.SHOP_CLOUD9_TICKET),
    ["blocking"],
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_STEREO_SYSTEM,
    "Stereo System",
    tileCell(MapEntityTypeId.SHOP_STEREO_SYSTEM),
    ["blocking"],
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_EXTRA_MUSIC,
    "Extra Music",
    tileCell(MapEntityTypeId.SHOP_EXTRA_MUSIC),
    ["blocking"],
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_SPEED_SHOES,
    "Speed Shoes",
    tileCell(MapEntityTypeId.SHOP_SPEED_SHOES),
    ["blocking"],
    ["object-interaction", "dialog"],
  ),
  surface(
    MapEntityTypeId.SHOP_COIN_RADAR,
    "Coin Radar",
    tileCell(MapEntityTypeId.SHOP_COIN_RADAR),
    ["blocking"],
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
    [],
    [{ behavior: pickupBehavior }],
  ),
];

const snowDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.SNOW,
  facts: ["blocking"],
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "Snow" },
};

const highGrassDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.HIGH_GRASS,
  facts: ["blocking"],
  stackOrder: COVER_STACK_ORDER,
  presentation: { name: "High Grass" },
};

export const staticCoverModules: readonly EntityModule[] = [
  staticEntity(snowDefinition, tileCell(MapEntityTypeId.SNOW), [
    { behavior: shovelableBehavior },
    { behavior: bobbyBridgeOnCover },
  ]),
  staticEntity(highGrassDefinition, tileCell(MapEntityTypeId.HIGH_GRASS), [
    { behavior: mowableBehavior },
    { behavior: bobbyBridgeOnCover },
  ]),
];

const beanstalkFacts = ["climbable"] as const;

const windmillDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.WINDMILL,
  facts: ["blocking"],
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
  carrot,
  egg,
  content(
    MapEntityTypeId.BEANSTALK,
    "Beanstalk",
    tileCell(MapEntityTypeId.BEANSTALK, { role: "tip" }),
    beanstalkFacts,
    [],
  ),
  content(MapEntityTypeId.BEAN, "Bean", tileCell(MapEntityTypeId.BEAN), [], [
    { behavior: pickupBehavior },
  ]),
  windmill,
  content(MapEntityTypeId.GAS, "Gas", tileCell(MapEntityTypeId.GAS), [], [
    { behavior: pickupBehavior },
  ]),
  content(
    RuntimeEntityTypeId.BEANSTALK_MID,
    "Beanstalk Mid",
    tileCell("beanstalk", { role: "middle" }),
    ["climbable"],
    [],
  ),
  content(
    RuntimeEntityTypeId.BEANSTALK_BASE,
    "Beanstalk Base",
    tileCell("beanstalk", { role: "base" }),
    ["climbable"],
  ),
  content(
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
    [],
    [{ behavior: collectBehavior }],
  ),
  content(
    MapEntityTypeId.BONUS_COIN,
    "Bonus Coin",
    tileCell(MapEntityTypeId.BONUS_COIN),
    [],
    [{ behavior: collectBehavior }],
  ),
];
