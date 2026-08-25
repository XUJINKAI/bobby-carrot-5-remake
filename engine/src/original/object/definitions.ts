import type { ObjectType } from "../../data/types.js";
import { EMPTY_OBJECT, ObjectId } from "../../mechanics/ids.js";
import {
  enterBehavior,
  leaveBehavior,
  markerBehavior,
  passageBehavior,
  type TileBehavior,
} from "../../mechanics/behaviors.js";
import {
  DYNAMIC_IDS,
  HIDDEN_AUTHORING_OBJECTS,
} from "../../mechanics/definition-semantics.js";
import type {
  TileDefinition,
  TileTrait,
} from "../../mechanics/definition-types.js";

interface ObjectRegistration {
  object(definition: TileDefinition<ObjectType>): void;
  objectDef(
    id: ObjectType,
    category: string,
    traits: TileTrait[],
    behaviors: TileBehavior[],
  ): void;
}

export function registerOriginalObjectDefinitions({
  object,
  objectDef,
}: ObjectRegistration): void {
  for (const id of Object.values(ObjectId) as ObjectType[])
    objectDef(
      id,
      DYNAMIC_IDS.has(id) ? "dynamic-object" : "object",
      DYNAMIC_IDS.has(id) ? ["dynamic"] : [],
      [markerBehavior("static-object", "无额外运行时行为")],
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
    ["object-passage-override", "dragon-fire-blocking", "pushable"],
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
}
