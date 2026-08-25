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

export function registerGround(ports: TerrainRegistration): void {
  const { terrainDef } = ports;
  for (const id of Object.values(Terrain) as TerrainType[]) {
    const water = isWaterSemantic(id),
      walkable = isWalkableSemantic(id);
    terrainDef(
      id,
      water ? "water" : walkable ? "terrain" : "background",
      [
        ...(walkable ? ["walkable" as TileTrait] : []),
        ...(water ? ["water" as TileTrait] : []),
        ...(id === Terrain.START ? ["start" as TileTrait] : []),
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
}
