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

export function registerSwitches(ports: TerrainRegistration): void {
  const { terrainDef } = ports;
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
}
