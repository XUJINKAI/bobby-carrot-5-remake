import { MapEntityTypeId } from "@bobby/model";
import type {
  EntityBehaviorBinding,
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  collectBehavior,
  pickupBehavior,
  requiresUnmountedReachBehavior,
} from "../behaviorLibrary.js";
import { RuntimeEntityTypeId } from "../runtime-types.js";
import {
  atlasVisual,
  originalModule,
  tileCell,
  staticEntity,
} from "./module.js";

function surface(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof tileCell>,
  presenceFacts: EntityModuleDefinition["presenceFacts"] = ["walkable"],
  mechanisms: readonly string[] = [],
  behaviorBindings: readonly EntityBehaviorBinding[] = [],
): EntityModule {
  return staticEntity(
    {
      type,
      presenceFacts,
      mechanisms,
      presentation: { name },
    },
    atlas,
    behaviorBindings,
  );
}

function content(
  type: EntityModuleDefinition["type"],
  name: string,
  atlas: ReturnType<typeof tileCell>,
  presenceFacts: EntityModuleDefinition["presenceFacts"] = [],
  behaviorBindings: readonly EntityBehaviorBinding[] = [],
): EntityModule {
  return staticEntity(
    {
      type,
      presenceFacts,
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
    ["object-interaction"],
  ),
  surface(
    MapEntityTypeId.SHOP_CLOUD9_TICKET,
    "Cloud 9 Ticket",
    tileCell(MapEntityTypeId.SHOP_CLOUD9_TICKET),
    ["blocking"],
    ["object-interaction"],
  ),
  surface(
    MapEntityTypeId.SHOP_STEREO_SYSTEM,
    "Stereo System",
    tileCell(MapEntityTypeId.SHOP_STEREO_SYSTEM),
    ["blocking"],
    ["object-interaction"],
  ),
  surface(
    MapEntityTypeId.SHOP_EXTRA_MUSIC,
    "Extra Music",
    tileCell(MapEntityTypeId.SHOP_EXTRA_MUSIC),
    ["blocking"],
    ["object-interaction"],
  ),
  surface(
    MapEntityTypeId.SHOP_SPEED_SHOES,
    "Speed Shoes",
    tileCell(MapEntityTypeId.SHOP_SPEED_SHOES),
    ["blocking"],
    ["object-interaction"],
  ),
  surface(
    MapEntityTypeId.SHOP_COIN_RADAR,
    "Coin Radar",
    tileCell(MapEntityTypeId.SHOP_COIN_RADAR),
    ["blocking"],
    ["object-interaction"],
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

const beanstalkCoverFacts = ["climbable", "contact-cover", "walkable"] as const;

const windmillDefinition: EntityModuleDefinition = {
  type: MapEntityTypeId.WINDMILL,
  presenceFacts: ["blocking"],
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
  content(
    MapEntityTypeId.BEANSTALK,
    "Beanstalk",
    tileCell(MapEntityTypeId.BEANSTALK, { role: "tip" }),
    beanstalkCoverFacts,
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
    beanstalkCoverFacts,
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
