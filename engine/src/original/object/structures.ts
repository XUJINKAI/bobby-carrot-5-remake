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

import type { ObjectRegistration } from "./index.js";

export function registerStructures(ports: ObjectRegistration): void {
  const { object, objectDef } = ports;
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
}
