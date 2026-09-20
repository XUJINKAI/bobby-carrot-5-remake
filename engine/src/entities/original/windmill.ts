import {
  MapEntityTypeId,
  ORIGINAL_TILE_ATLASES,
  originalTileAnimation,
  type Direction,
} from "@bobby/model";
import { ORIGINAL_GAMEPLAY_IMAGE_IDS } from "../../image/OriginalGameplayImages.js";
import { originalAmbientPhase } from "../../visual/OriginalTileAnimationTiming.js";
import type {
  ImageVisualLayer,
  VisualDefinition,
  VisualResolveContext,
} from "../../visual/VisualDefinition.js";
import type {
  EntityModule,
  EntityModuleDefinition,
} from "../EntityModule.js";
import {
  originalAmbientAnimationLayer,
  originalModule,
  tileCell,
} from "./module.js";

const ORIGINAL_TILE_SIZE = 48;
const VERTICAL_GUST_FRAMES = originalTileAnimation({
  type: MapEntityTypeId.WINDMILL,
  id: "gust-vertical",
}).frames;
const HORIZONTAL_GUST_FRAMES = originalTileAnimation({
  type: MapEntityTypeId.WINDMILL,
  id: "gust-horizontal",
}).frames;

const definition: EntityModuleDefinition = {
  type: MapEntityTypeId.WINDMILL,
  presenceFacts: ["blocking"],
  presentation: { name: "Windmill" },
};

const visual: VisualDefinition = {
  id: MapEntityTypeId.WINDMILL,
  resolve(context) {
    const direction = context.entity.direction ?? "right";
    const atlas = tileCell(MapEntityTypeId.WINDMILL, {
      fields: { direction },
    });
    const active = windDirectionIsActive(context, direction);
    const rotor = active && context.time
      ? originalAmbientAnimationLayer({
          type: MapEntityTypeId.WINDMILL,
          id: "ambient",
          fields: { direction },
        }, context.time.nowMs)
      : null;
    return {
      layers: [
        rotor ?? { kind: "atlas", column: atlas.column, row: atlas.row },
        ...(active ? gustLayers(direction, context.time?.nowMs ?? 0) : []),
      ],
    };
  },
};

export const windmill: EntityModule = originalModule(definition, visual);

function windDirectionIsActive(
  context: VisualResolveContext,
  direction: Direction,
): boolean {
  return context.query.entitiesOfType(MapEntityTypeId.WIND_SWITCH).some(
    (entity) =>
      entity.direction === direction && entity.state?.active === true,
  );
}

function gustLayers(direction: Direction, nowMs: number): ImageVisualLayer[] {
  const frames = direction === "up" || direction === "down"
    ? VERTICAL_GUST_FRAMES
    : HORIZONTAL_GUST_FRAMES;
  const source = frames[originalAmbientPhase(nowMs, frames.length)];
  if (!source || source.atlas !== "ta")
    throw new Error(`原版 Windmill 风场缺少 ta.png 帧：${direction}`);
  const vector = directionVector(direction);
  return Array.from({ length: 3 }, (_, index) => {
    const distance = index + 0.5;
    return {
      kind: "image",
      renderPass: "world-effect",
      asset: ORIGINAL_GAMEPLAY_IMAGE_IDS.animatedTiles,
      frameWidth: ORIGINAL_TILE_SIZE,
      frameHeight: ORIGINAL_TILE_SIZE,
      frameIndex:
        (source.row - 1) * ORIGINAL_TILE_ATLASES.ta.columns +
        source.column - 1,
      anchor: "center",
      offsetX: vector.x * distance * ORIGINAL_TILE_SIZE,
      offsetY: vector.y * distance * ORIGINAL_TILE_SIZE,
    };
  });
}

function directionVector(direction: Direction): { x: number; y: number } {
  return {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  }[direction];
}
