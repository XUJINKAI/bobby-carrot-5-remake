import type { ObjectType, TerrainType } from "../data/types.js";
import {
  EMPTY_OBJECT,
  ObjectId,
  Terrain,
  type Direction,
} from "../mechanics/ids.js";
import {
  directionalPassage,
  fireReflectionBehavior,
  enterBehavior,
  leaveBehavior,
  markerBehavior,
  passageBehavior,
  preEnterBehavior,
  rotateOnLeave,
  type BehaviorDescription,
  type BehaviorRuntimeContext,
  type TileBehavior,
} from "../mechanics/behaviors.js";
import { applyDefinitionAugments } from "./definition-augments.js";

import {
  DYNAMIC_IDS,
  HIDDEN_AUTHORING_OBJECTS,
  environmentTraits,
  isWalkableSemantic,
  isWaterSemantic,
  pretty,
} from "../mechanics/definition-semantics.js";
import {
  CAROUSEL_NEXT,
  rotateCarousel,
  toggleColor,
  toggleSpeed,
  toggleTide,
} from "../mechanics/terrain-transforms.js";
import { CLOUD_INFO } from "../mechanics/mechanic-links.js";
import type {
  TileAuthoring,
  TileDefinition,
  TileDefinitionInspection,
  TilePresentation,
  TileTrait,
} from "../mechanics/definition-types.js";
import { definitionRegistry } from "../mechanics/definition/registry.js";
import { inspectDefinition } from "../mechanics/definition/inspection.js";
import { definitionHasTrait } from "../mechanics/traits/queries.js";
export {
  cloudGridForObject,
  tideDirectionForTerrain,
  windmillInfoForObject,
  windSwitchIndexForTerrain,
  windSwitchPeerForTerrain,
} from "../mechanics/mechanic-links.js";
export type {
  TileAuthoring,
  TileDefinition,
  TileDefinitionInspection,
  TilePresentation,
  TileTrait,
} from "../mechanics/definition-types.js";
function terrain(definition: TileDefinition<TerrainType>): void {
  definitionRegistry.registerTerrain(definition);
}
function object(definition: TileDefinition<ObjectType>): void {
  definitionRegistry.registerObject(definition);
}
function terrainDef(
  id: TerrainType,
  category: string,
  traits: TileTrait[],
  behaviors: TileBehavior[],
): void {
  terrain({
    id,
    presentation: { name: pretty(id), category },
    traits: [...new Set([...environmentTraits(id), ...traits])],
    behaviors,
    authoring: { palette: true },
  });
}
function objectDef(
  id: ObjectType,
  category: string,
  traits: TileTrait[],
  behaviors: TileBehavior[],
): void {
  object({
    id,
    presentation: { name: pretty(id), category },
    traits,
    behaviors,
    authoring: { palette: !HIDDEN_AUTHORING_OBJECTS.has(id) },
  });
}
for (const id of Object.values(Terrain) as TerrainType[]) {
  const water = isWaterSemantic(id),
    walkable = isWalkableSemantic(id);
  terrainDef(
    id,
    water ? "water" : walkable ? "terrain" : "background",
    [
      ...(walkable ? ["walkable" as TileTrait] : []),
      ...(water ? ["water" as TileTrait] : []),
    ],
    [
      markerBehavior(
        walkable
          ? "ordinary-walkable"
          : water
            ? "water-background"
            : "background",
        walkable
          ? "使用普通步行规则"
          : water
            ? "水面默认不能直接步行"
            : "背景/边界默认不能直接步行",
      ),
    ],
  );
}
for (const id of Object.values(ObjectId) as ObjectType[])
  objectDef(
    id,
    DYNAMIC_IDS.has(id) ? "dynamic-object" : "object",
    DYNAMIC_IDS.has(id) ? ["dynamic"] : [],
    [markerBehavior("static-object", "无额外运行时行为")],
  );
function defineCarousel(
  id: TerrainType,
  next: TerrainType,
  enter: Direction[],
  leave: Direction[],
): void {
  terrainDef(
    id,
    "movement",
    ["walkable", "carousel", "directional-passage", "rotatable"],
    [directionalPassage({ enter, leave }), rotateOnLeave(next)],
  );
}
defineCarousel(
  Terrain.CAROUSEL_1,
  Terrain.CAROUSEL_4,
  ["left", "down"],
  ["right", "up"],
);
defineCarousel(
  Terrain.CAROUSEL_2,
  Terrain.CAROUSEL_1,
  ["right", "down"],
  ["left", "up"],
);
defineCarousel(
  Terrain.CAROUSEL_3,
  Terrain.CAROUSEL_2,
  ["right", "up"],
  ["left", "down"],
);
defineCarousel(
  Terrain.CAROUSEL_4,
  Terrain.CAROUSEL_3,
  ["left", "up"],
  ["right", "down"],
);
defineCarousel(
  Terrain.CAROUSEL_VERTICAL,
  Terrain.CAROUSEL_HORIZONTAL,
  ["up", "down"],
  ["up", "down"],
);
defineCarousel(
  Terrain.CAROUSEL_HORIZONTAL,
  Terrain.CAROUSEL_VERTICAL,
  ["left", "right"],
  ["left", "right"],
);
const mirrorDefs: Array<
  [TerrainType, TerrainType, Partial<Record<Direction, Direction>>]
> = [
  [Terrain.MIRROR_1, Terrain.MIRROR_2, { left: "down", up: "right" }],
  [Terrain.MIRROR_2, Terrain.MIRROR_4, { right: "down", up: "left" }],
  [Terrain.MIRROR_3, Terrain.MIRROR_1, { left: "up", down: "right" }],
  [Terrain.MIRROR_4, Terrain.MIRROR_3, { right: "up", down: "left" }],
];
for (const [id, next, reflections] of mirrorDefs)
  terrainDef(
    id,
    "movement",
    ["walkable", "mirror", "rotatable"],
    [
      passageBehavior("mower-blocked", "割草机不能驶过魔法镜", (ctx) =>
        ctx.state.ridingMower
          ? {
              passable: false,
              reason: "割草机不能驶过魔法镜",
              confidence: "confirmed",
            }
          : undefined,
      ),
      fireReflectionBehavior("reflect-dragon-fire", reflections),
      rotateOnLeave(next),
    ],
  );
terrainDef(
  Terrain.SNOW,
  "terrain",
  ["terrain-passage-override"],
  [
    passageBehavior(
      "requires-shovel",
      "需要雪铲清除；割草机不能铲雪",
      (ctx) => {
        if (ctx.state.ridingMower)
          return {
            passable: false,
            reason: "割草机不能铲雪",
            confidence: "inferred",
          };
        return ctx.state.inventory.shovel
          ? {
              passable: true,
              clearsSnow: true,
              reason: "雪铲清除雪堆",
              confidence: "confirmed",
            }
          : { passable: false, reason: "需要雪铲", confidence: "confirmed" };
      },
    ),
  ],
);
for (const id of [
  Terrain.WATER,
  Terrain.WATER_ANIMATED,
  Terrain.TIDE_UP,
  Terrain.TIDE_DOWN,
  Terrain.TIDE_LEFT,
  Terrain.TIDE_RIGHT,
  Terrain.WATER_VARIANT_1,
  Terrain.WATER_VARIANT_2,
  Terrain.WATER_VARIANT_3,
])
  terrainDef(
    id,
    "water",
    ["water"],
    [
      markerBehavior(
        "requires-overlay",
        "普通步行需要荷叶、木板或藤蔓等覆盖对象",
      ),
    ],
  );
for (const id of [
  Terrain.COLOR_YELLOW_BLOCK_RAISED,
  Terrain.COLOR_PINK_BLOCK_RAISED,
])
  terrainDef(
    id,
    "switch",
    ["terrain-passage-override", "blocking"],
    [
      passageBehavior("raised-block", "升起状态阻挡 Bobby", () => ({
        passable: false,
        reason: "彩色方块当前处于升起状态",
        confidence: "confirmed",
      })),
    ],
  );
for (const id of [
  Terrain.COLOR_YELLOW_BLOCK_LOWERED,
  Terrain.COLOR_PINK_BLOCK_LOWERED,
])
  terrainDef(
    id,
    "switch",
    ["walkable"],
    [markerBehavior("lowered-block", "降下状态可通行")],
  );
for (const id of [Terrain.HIGH_GRASS, Terrain.HIGH_GRASS_OBJECTIVE])
  terrainDef(
    id,
    "mower",
    ["terrain-passage-override"],
    [
      passageBehavior("requires-mower", "只有驾驶割草机才能通过", (ctx) =>
        ctx.state.ridingMower
          ? {
              passable: true,
              reason: "割草机可以通过高草",
              confidence: "confirmed",
            }
          : {
              passable: false,
              reason: "高草必须使用割草机通过",
              confidence: "confirmed",
            },
      ),
      preEnterBehavior(
        "mow-on-enter",
        id === Terrain.HIGH_GRASS_OBJECTIVE
          ? "割开高草并揭示隐藏目标"
          : "割开高草",
        (ctx) => {
          if (ctx.mode !== "normal") return;
          const hidden = ctx.terrainId === Terrain.HIGH_GRASS_OBJECTIVE;
          ctx.api.setTerrain(ctx.api.mowedGround());
          if (hidden && ctx.objectId === EMPTY_OBJECT)
            ctx.api.setObject(
              ctx.state.objectiveMode === "carrot"
                ? ObjectId.CARROT
                : ObjectId.EGG_NEST_EMPTY,
            );
          ctx.api.event("mow", hidden ? "割开高草，发现目标" : "割开高草");
          return { stop: true };
        },
      ),
    ],
  );
terrainDef(
  Terrain.SHOVEL_PICKUP,
  "pickup",
  ["walkable", "pickup"],
  [
    enterBehavior(
      "collect-shovel",
      "取得雪铲并把地形变为清理后的地面",
      (ctx) => {
        if (ctx.mode !== "normal") return;
        ctx.state.inventory.shovel = true;
        ctx.api.setTerrain(Terrain.SHOVEL_CLEARED_GROUND);
        ctx.api.event("collect-shovel", "取得雪铲");
      },
    ),
  ],
);
terrainDef(
  Terrain.TRAP_INACTIVE,
  "hazard",
  ["walkable", "hazard"],
  [
    leaveBehavior("activate-on-leave", "离开后变为激活陷阱", (ctx) => {
      ctx.api.setTerrain(Terrain.TRAP_ACTIVE);
    }),
  ],
);
terrainDef(
  Terrain.TRAP_ACTIVE,
  "hazard",
  ["walkable", "hazard"],
  [
    enterBehavior("kill-on-enter", "步行踩入会死亡；割草机免疫", (ctx) => {
      if (ctx.mode === "normal" && !ctx.state.ridingMower)
        ctx.api.kill("踩中了已经激活的陷阱");
    }),
  ],
);
terrainDef(
  Terrain.CAROUSEL_SWITCH_RAISED,
  "switch",
  ["walkable", "switch"],
  [
    enterBehavior(
      "rotate-all-carousel",
      "旋转全部 Carousel 并按下开关",
      (ctx) => {
        if (ctx.mode !== "normal") return;
        ctx.api.mapTerrain((type) =>
          CAROUSEL_NEXT.has(type)
            ? rotateCarousel(type)
            : type === Terrain.CAROUSEL_SWITCH_RAISED
              ? Terrain.CAROUSEL_SWITCH_PRESSED
              : type === Terrain.CAROUSEL_SWITCH_PRESSED
                ? Terrain.CAROUSEL_SWITCH_RAISED
                : type,
        );
        ctx.api.event("toggle-switch", "旋转全部 Carousel 地板");
      },
    ),
  ],
);
terrainDef(
  Terrain.CAROUSEL_SWITCH_PRESSED,
  "switch",
  ["walkable", "switch"],
  [markerBehavior("pressed-switch", "已按下；不会再次触发")],
);
terrainDef(
  Terrain.SPEED_SWITCH_RAISED,
  "switch",
  ["walkable", "switch"],
  [
    enterBehavior("toggle-speed", "反转全部加速方向", (ctx) => {
      if (ctx.mode === "normal") {
        ctx.api.mapTerrain(toggleSpeed);
        ctx.api.event("toggle-switch", "反转全部加速方向");
      }
    }),
  ],
);
terrainDef(
  Terrain.SPEED_SWITCH_PRESSED,
  "switch",
  ["walkable", "switch"],
  [markerBehavior("pressed-switch", "已按下；不会再次触发")],
);
terrainDef(
  Terrain.TIDE_SWITCH_RAISED,
  "switch",
  ["walkable", "switch"],
  [
    enterBehavior("toggle-tide", "反转全部潮汐方向", (ctx) => {
      if (ctx.mode === "normal") {
        ctx.api.mapTerrain(toggleTide);
        ctx.api.event("toggle-switch", "反转潮汐方向");
      }
    }),
  ],
);
terrainDef(
  Terrain.TIDE_SWITCH_PRESSED,
  "switch",
  ["walkable", "switch"],
  [markerBehavior("pressed-switch", "已按下；不会再次触发")],
);
terrainDef(
  Terrain.COLOR_YELLOW_SWITCH_RAISED,
  "switch",
  ["walkable", "switch"],
  [
    enterBehavior("toggle-yellow", "切换黄色开关与方块", (ctx) => {
      if (ctx.mode === "normal") {
        ctx.api.mapTerrain((t) => toggleColor(t, "yellow"));
        ctx.api.event("toggle-switch", "切换黄色机关");
      }
    }),
  ],
);
terrainDef(
  Terrain.COLOR_YELLOW_SWITCH_PRESSED,
  "switch",
  ["walkable", "switch"],
  [markerBehavior("pressed-switch", "已按下；不会再次触发")],
);
terrainDef(
  Terrain.COLOR_PINK_SWITCH_RAISED,
  "switch",
  ["walkable", "switch"],
  [
    enterBehavior("toggle-pink", "切换粉色开关与方块", (ctx) => {
      if (ctx.mode === "normal") {
        ctx.api.mapTerrain((t) => toggleColor(t, "pink"));
        ctx.api.event("toggle-switch", "切换粉色机关");
      }
    }),
  ],
);
terrainDef(
  Terrain.COLOR_PINK_SWITCH_PRESSED,
  "switch",
  ["walkable", "switch"],
  [markerBehavior("pressed-switch", "已按下；不会再次触发")],
);
const windSwitches: Array<[TerrainType, number]> = [
  [Terrain.WIND_SWITCH_0_ON, 0],
  [Terrain.WIND_SWITCH_0_OFF, 0],
  [Terrain.WIND_SWITCH_1_ON, 1],
  [Terrain.WIND_SWITCH_1_OFF, 1],
  [Terrain.WIND_SWITCH_2_ON, 2],
  [Terrain.WIND_SWITCH_2_OFF, 2],
  [Terrain.WIND_SWITCH_3_ON, 3],
  [Terrain.WIND_SWITCH_3_OFF, 3],
];
for (const [id, index] of windSwitches)
  terrainDef(
    id,
    "switch",
    ["walkable", "switch"],
    [
      enterBehavior(
        "toggle-wind",
        "切换对应风车并推动云",
        (ctx) => {
          if (ctx.mode === "normal") {
            ctx.api.toggleWind(index);
            ctx.api.event("toggle-switch", `切换风车 ${index + 1}`);
            ctx.api.propelClouds();
          }
        },
        { index },
      ),
    ],
  );
const speedDirections: Array<[TerrainType, Direction]> = [
  [Terrain.SPEED_LEFT, "left"],
  [Terrain.SPEED_RIGHT, "right"],
  [Terrain.SPEED_UP, "up"],
  [Terrain.SPEED_DOWN, "down"],
];
for (const [id, direction] of speedDirections)
  terrainDef(
    id,
    "movement",
    ["walkable", "forced-movement"],
    [
      enterBehavior(
        "force-speed",
        "进入后按格子方向高速移动",
        (ctx) => {
          if (ctx.mode === "normal")
            ctx.state.forced = { kind: "speed", direction };
        },
        { direction },
      ),
    ],
  );
terrainDef(
  Terrain.ICE,
  "movement",
  ["walkable", "forced-movement"],
  [
    enterBehavior("force-ice", "沿进入方向继续滑行", (ctx) => {
      if (ctx.mode === "normal")
        ctx.state.forced = { kind: "ice", direction: ctx.direction };
    }),
  ],
);
terrainDef(
  Terrain.MOWER_PARKING,
  "vehicle",
  ["walkable"],
  [
    enterBehavior("leave-mower", "驾驶割草机进入停车位后自动下车", (ctx) => {
      if (ctx.mode === "normal" && ctx.state.ridingMower && !ctx.justBoarded) {
        ctx.api.setObject(ObjectId.MOWER);
        ctx.state.ridingMower = false;
        ctx.state.forced = { kind: "mower-exit", direction: "right" };
        ctx.api.event("leave-mower", "在停车位自动下车");
      }
    }),
  ],
);
terrainDef(
  Terrain.EXIT,
  "objective",
  ["walkable", "exit"],
  [
    enterBehavior("complete-level", "主要目标清空后进入出口完成关卡", (ctx) => {
      if (
        ctx.mode === "normal" &&
        !ctx.state.ridingMower &&
        ctx.state.objectiveRemaining === 0
      ) {
        ctx.state.completed = true;
        ctx.state.forced = null;
        ctx.api.event("complete", "关卡完成");
      }
    }),
  ],
);
const overlayObjects: Array<[ObjectType, string]> = [
  [ObjectId.PLANK, "Plank"],
  [ObjectId.BEANSTALK_TIP, "Beanstalk Tip"],
  [ObjectId.BEANSTALK_MID, "Beanstalk Mid"],
  [ObjectId.BEANSTALK_BASE, "Beanstalk Base"],
];
for (const [id, name] of overlayObjects)
  object({
    id,
    presentation: { name, category: "overlay" },
    traits: ["terrain-overlay"],
    behaviors: [
      markerBehavior(
        "terrain-passage-overlay",
        "覆盖底层不可步行地形并提供通路",
      ),
      ...(id === ObjectId.PLANK
        ? [
            leaveBehavior(
              "crumble-on-leave",
              "离开木板后进入坍塌阶段",
              (ctx) => {
                ctx.api.setObject(ObjectId.PLANK_CRUMBLING);
                ctx.state.previousCrumblingPlank = { x: ctx.x, y: ctx.y };
              },
            ),
          ]
        : []),
    ],
    authoring: { palette: !HIDDEN_AUTHORING_OBJECTS.has(id) },
  });
objectDef(
  ObjectId.LOCK,
  "gate",
  ["object-passage-override"],
  [
    passageBehavior("requires-key", "需要 Beaver Key 或 Super Key", (ctx) =>
      ctx.state.profile.superKey || ctx.state.profile.temporaryKey
        ? {
            passable: true,
            consumesLock: true,
            reason: ctx.state.profile.superKey
              ? "Super Key 打开锁"
              : "一次性 Beaver Key 打开锁",
            confidence: "confirmed",
          }
        : {
            passable: false,
            reason: "需要 Beaver 的钥匙或 Super Key",
            confidence: "confirmed",
          },
    ),
  ],
);
objectDef(
  ObjectId.MOWER,
  "vehicle",
  ["object-passage-override"],
  [
    passageBehavior("board-mower", "取得汽油后可登上割草机", (ctx) => {
      if (ctx.state.ridingMower)
        return {
          passable: false,
          reason: "已经在驾驶割草机",
          confidence: "inferred",
        };
      return ctx.state.inventory.gas
        ? {
            passable: true,
            boardsMower: true,
            reason: "登上已加油的割草机",
            confidence: "confirmed",
          }
        : {
            passable: false,
            reason: "割草机需要先取得汽油",
            confidence: "confirmed",
          };
    }),
  ],
);
objectDef(
  ObjectId.WHIRLWIND,
  "flight",
  ["object-passage-override"],
  [
    passageBehavior("requires-kite", "取得风筝后进入飞行状态", (ctx) => {
      if (ctx.state.ridingMower)
        return {
          passable: false,
          reason: "割草机不能进入龙卷风",
          confidence: "confirmed",
        };
      return ctx.state.inventory.kite
        ? {
            passable: true,
            startsFlight: true,
            reason: "风筝被龙卷风带起",
            confidence: "confirmed",
          }
        : {
            passable: false,
            reason: "需要风筝才能进入龙卷风",
            confidence: "confirmed",
          };
    }),
  ],
);
objectDef(
  ObjectId.CRUMBLY_ROCK,
  "mower",
  ["object-passage-override", "dragon-fire-blocking", "pushbox"],
  [
    passageBehavior("break-by-fast-mower", "高速割草机可以撞碎", (ctx) =>
      ctx.state.ridingMower && ctx.state.forced?.kind === "speed"
        ? {
            passable: true,
            reason: "高速割草机撞碎岩石",
            confidence: "confirmed",
          }
        : {
            passable: false,
            reason: "岩石需要高速割草机撞碎",
            confidence: "confirmed",
          },
    ),
    enterBehavior("break-on-enter", "高速割草机进入后移除岩石", (ctx) => {
      if (
        ctx.mode === "normal" &&
        ctx.state.ridingMower &&
        ctx.state.forced?.kind === "speed"
      ) {
        ctx.api.setObject(EMPTY_OBJECT);
        ctx.api.event("break-rock", "高速割草机撞碎岩石");
      }
    }),
  ],
);
objectDef(
  ObjectId.CARROT,
  "collectible",
  ["collectible", "objective-carrot"],
  [
    enterBehavior("collect-carrot", "收集主要目标胡萝卜", (ctx) => {
      if (ctx.mode === "normal") {
        ctx.state.objectiveRemaining = Math.max(
          0,
          ctx.state.objectiveRemaining - 1,
        );
        ctx.api.setObject(ObjectId.CONSUMED_CARROT);
        ctx.api.event("collect-carrot", "收集胡萝卜");
      }
    }),
  ],
);
objectDef(
  ObjectId.EGG_NEST_EMPTY,
  "objective",
  ["collectible", "objective-nest"],
  [
    leaveBehavior("fill-nest-on-leave", "离开空蛋巢时完成该目标", (ctx) => {
      ctx.api.setObject(ObjectId.EGG_NEST_FILLED);
      ctx.state.objectiveRemaining = Math.max(
        0,
        ctx.state.objectiveRemaining - 1,
      );
      ctx.api.event("fill-nest", "填满一个彩蛋巢");
    }),
  ],
);
objectDef(
  ObjectId.GAS,
  "pickup",
  ["pickup"],
  [
    enterBehavior("collect-gas", "取得割草机汽油", (ctx) => {
      if (ctx.mode === "normal") {
        ctx.state.inventory.gas = true;
        ctx.api.setObject(EMPTY_OBJECT);
        ctx.api.event("collect-gas", "取得割草机汽油，本关永久有效");
      }
    }),
  ],
);
objectDef(
  ObjectId.KITE,
  "pickup",
  ["pickup"],
  [
    enterBehavior("collect-kite", "取得风筝", (ctx) => {
      if (ctx.mode === "normal") {
        ctx.state.inventory.kite = true;
        ctx.api.setObject(EMPTY_OBJECT);
        ctx.api.event("collect-kite", "取得风筝");
      }
    }),
  ],
);
objectDef(
  ObjectId.BEAN,
  "pickup",
  ["pickup"],
  [
    enterBehavior("collect-bean", "取得魔豆", (ctx) => {
      if (ctx.mode === "normal") {
        ctx.state.inventory.beans += 1;
        ctx.api.setObject(EMPTY_OBJECT);
        ctx.api.event("collect-bean", "取得魔豆");
      }
    }),
  ],
);
objectDef(
  ObjectId.BEAN_FIELD,
  "beanstalk",
  [],
  [
    enterBehavior("plant-bean", "持有魔豆时种下并启动藤蔓生长", (ctx) => {
      if (ctx.mode === "normal" && ctx.state.inventory.beans > 0) {
        ctx.state.inventory.beans -= 1;
        ctx.api.setObject(ObjectId.BEAN_SPROUT);
        ctx.state.beanstalkGrowth.push({
          x: ctx.x,
          baseY: ctx.y,
          stage: 1,
          ticksUntilGrowth: 16,
        });
        ctx.api.event("plant-bean", "种下魔豆，藤蔓开始生长");
      }
    }),
  ],
);
objectDef(
  ObjectId.GOLDEN_CARROT,
  "collectible",
  ["collectible"],
  [
    enterBehavior("collect-golden-carrot", "取得金胡萝卜", (ctx) => {
      ctx.state.goldenCarrotsInLevel += 1;
      ctx.api.setObject(EMPTY_OBJECT);
      ctx.api.event(
        "collect-golden-carrot",
        ctx.mode === "flight" ? "飞行中取得金胡萝卜" : "取得金胡萝卜",
      );
    }),
  ],
);
objectDef(
  ObjectId.BONUS_COIN,
  "collectible",
  ["collectible"],
  [
    enterBehavior("collect-bonus-coin", "取得 Bonus Coin", (ctx) => {
      ctx.state.bonusCoinsInLevel += 1;
      ctx.api.setObject(EMPTY_OBJECT);
      ctx.api.event(
        "collect-bonus-coin",
        ctx.mode === "flight" ? "飞行中取得 Bonus Coin" : "取得 Bonus Coin",
      );
    }),
  ],
);
objectDef(
  ObjectId.DRAGON_TAIL,
  "dragon",
  [],
  [
    enterBehavior("trigger-dragon-fire", "踩到龙尾触发喷火", (ctx) => {
      if (ctx.mode === "normal") ctx.api.fireDragon();
    }),
  ],
);
objectDef(
  ObjectId.LANDING,
  "flight",
  [],
  [
    enterBehavior("land-flight", "飞行状态进入降落点后结束强制飞行", (ctx) => {
      if (ctx.state.forced?.kind === "flight") ctx.state.forced = null;
    }),
  ],
);
applyDefinitionAugments({
  defineObject: objectDef,
  getObject: getObjectDefinition,
  setObject: object,
  defineTerrain: terrainDef,
  getTerrain: getTerrainDefinition,
});
export const definitionRegistrationPorts = {
  defineObject: objectDef,
  getObject: getObjectDefinition,
  setObject: object,
  defineTerrain: terrainDef,
  getTerrain: getTerrainDefinition,
};
function variantTerrainDefinition(
  id: TerrainType,
): TileDefinition<TerrainType> {
  const water = isWaterSemantic(id),
    walkable = isWalkableSemantic(id);
  return {
    id,
    presentation: {
      name: pretty(id),
      category: walkable ? "terrain-variant" : "background-variant",
    },
    traits: environmentTraits(id),
    behaviors: [
      markerBehavior(
        walkable ? "ordinary-walkable" : "background",
        "未命名语义变体；行为按已确认类别处理",
      ),
    ],
    authoring: { palette: true },
  };
}
function variantObjectDefinition(id: ObjectType): TileDefinition<ObjectType> {
  return {
    id,
    presentation: { name: pretty(id), category: "object-variant" },
    traits: [],
    behaviors: [
      markerBehavior("unknown-object", "未命名对象变体；没有附加已确认行为"),
    ],
    authoring: { palette: true },
  };
}
export function reflectFireForTerrain(
  id: TerrainType,
  direction: Direction,
): Direction | null | false {
  for (const behavior of getTerrainDefinition(id).behaviors)
    if (behavior.reflectFire) return behavior.reflectFire(direction);
  return null;
}
export function getTerrainDefinition(
  id: TerrainType,
): TileDefinition<TerrainType> {
  return definitionRegistry.terrain(id) ?? variantTerrainDefinition(id);
}
export function getObjectDefinition(
  id: ObjectType,
): TileDefinition<ObjectType> {
  return definitionRegistry.object(id) ?? variantObjectDefinition(id);
}
export function isObjectAuthorable(id: ObjectType): boolean {
  return getObjectDefinition(id).authoring?.palette !== false;
}
export function terrainHasTrait(id: TerrainType, trait: TileTrait): boolean {
  return definitionHasTrait(getTerrainDefinition(id), trait);
}
export function objectHasTrait(id: ObjectType, trait: TileTrait): boolean {
  return definitionHasTrait(getObjectDefinition(id), trait);
}
export function nextTerrainAfterLeave(id: TerrainType): TerrainType {
  for (const behavior of getTerrainDefinition(id).behaviors) {
    const next = behavior.nextTerrainOnLeave?.(id);
    if (next !== undefined) return next;
  }
  return id;
}
export function runTerrainEnter(
  id: TerrainType,
  ctx: BehaviorRuntimeContext,
  phase: "before-object" | "after-object" = "after-object",
): boolean {
  for (const behavior of getTerrainDefinition(id).behaviors) {
    if (!behavior.onEnter || (behavior.enterPhase ?? "after-object") !== phase)
      continue;
    if (behavior.onEnter(ctx)?.stop) return true;
  }
  return false;
}
export function runTerrainLeave(
  id: TerrainType,
  ctx: BehaviorRuntimeContext,
): boolean {
  for (const behavior of getTerrainDefinition(id).behaviors)
    if (behavior.onLeave?.(ctx)?.stop) return true;
  return false;
}
export function runObjectEnter(
  id: ObjectType,
  ctx: BehaviorRuntimeContext,
): boolean {
  for (const behavior of getObjectDefinition(id).behaviors)
    if (behavior.onEnter?.(ctx)?.stop) return true;
  return false;
}
export function runObjectLeave(
  id: ObjectType,
  ctx: BehaviorRuntimeContext,
): boolean {
  for (const behavior of getObjectDefinition(id).behaviors)
    if (behavior.onLeave?.(ctx)?.stop) return true;
  return false;
}
export function inspectTerrainDefinition(
  id: TerrainType,
): TileDefinitionInspection {
  return inspectDefinition(getTerrainDefinition(id));
}
export function inspectObjectDefinition(
  id: ObjectType,
): TileDefinitionInspection {
  return inspectDefinition(getObjectDefinition(id));
}
