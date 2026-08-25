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
import type { TerrainRegistration } from "./index.js";

export function registerMovement(ports: TerrainRegistration): void {
  const { terrainDef } = ports;
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
}
