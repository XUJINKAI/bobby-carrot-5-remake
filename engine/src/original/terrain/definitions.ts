import type { TerrainType } from "../../data/types.js";
import {
  EMPTY_OBJECT,
  ObjectId,
  Terrain,
  type Direction,
} from "../../mechanics/ids.js";
import {
  directionalPassage,
  fireReflectionBehavior,
  enterBehavior,
  leaveBehavior,
  markerBehavior,
  passageBehavior,
  preEnterBehavior,
  rotateOnLeave,
  type TileBehavior,
} from "../../mechanics/behaviors.js";
import {
  environmentTraits,
  isWalkableSemantic,
  isWaterSemantic,
} from "../../mechanics/definition-semantics.js";
import {
  CAROUSEL_NEXT,
  rotateCarousel,
  toggleColor,
  toggleSpeed,
  toggleTide,
} from "../../mechanics/terrain-transforms.js";
import type { TileTrait } from "../../mechanics/definition-types.js";

interface TerrainRegistration {
  terrainDef(
    id: TerrainType,
    category: string,
    traits: TileTrait[],
    behaviors: TileBehavior[],
  ): void;
}

export function registerOriginalTerrainDefinitions({
  terrainDef,
}: TerrainRegistration): void {
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
}
