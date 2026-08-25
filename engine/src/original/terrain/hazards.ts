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

export function registerHazards(ports: TerrainRegistration): void {
  const { terrainDef } = ports;
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
      [
        "terrain-passage-override",
        ...(id === Terrain.HIGH_GRASS_OBJECTIVE
          ? ["hidden-objective" as TileTrait]
          : []),
      ],
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
}
