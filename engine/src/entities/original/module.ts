import {
  MapEntityTypeId,
  ORIGINAL_TILE_ATLASES,
  originalTileAnimation,
  originalTileVisual,
  type JsonPrimitive,
  type OriginalTileCoordinate,
  type Direction,
  type EntityType,
  type JsonValue,
} from "@bobby/model";
import { ORIGINAL_GAMEPLAY_IMAGE_IDS } from "../../image/OriginalGameplayImages.js";
import type { EntityFieldDefinition } from "../../world/entity/EntityDefinition.js";
import type {
  ImageVisualLayer,
  VisualDefinition,
  VisualResolveContext,
} from "../../visual/VisualDefinition.js";
import {
  ORIGINAL_AMBIENT_FRAME_MS,
  originalAmbientPhase,
} from "../../visual/OriginalTileAnimationTiming.js";
import {
  defineEntityModule,
  type EntityBehaviorBinding,
  type EntityModule,
  type EntityModuleDefinition,
} from "../EntityModule.js";

export interface AtlasCell {
  column: number;
  row: number;
}

const ORIGINAL_TILE_SIZE = 48;

const cell = (column: number, row: number): AtlasCell => ({ column, row });

export function tsCoordinateCell(source: OriginalTileCoordinate): AtlasCell {
  return cell(source.column - 1, source.row - 1);
}

export function tileCell(
  type: string,
  options: {
    fields?: Readonly<Record<string, JsonPrimitive>>;
    role?: string;
    phase?: string;
  } = {},
): AtlasCell {
  return tsCoordinateCell(originalTileVisual({ type, ...options }));
}

export function tileAnimationCell(
  type: string,
  animation: string,
  frame: number,
  options: {
    fields?: Readonly<Record<string, JsonPrimitive>>;
    role?: string;
  } = {},
): AtlasCell {
  const source = originalTileAnimation({
    type,
    id: animation,
    ...options,
  }).frames[frame - 1];
  if (!source || source.atlas !== "ts") {
    throw new Error(`原版 ts.png 动画帧不存在：${type}/${animation}/${frame}`);
  }
  return tsCoordinateCell(source);
}

export function originalModule(
  definition: EntityModuleDefinition,
  visual: VisualDefinition,
  behaviorBindings: readonly EntityBehaviorBinding[] = [],
): EntityModule {
  return defineEntityModule({
    definition,
    visual,
    behaviorBindings,
  });
}

export function atlasVisual(
  definition: EntityModuleDefinition,
  source: AtlasCell | ((context: VisualResolveContext) => AtlasCell | null),
): VisualDefinition {
  const resolveCell = typeof source === "function" ? source : () => source;
  return {
    id: definition.presentation.visual ?? definition.type,
    resolve(context) {
      const atlas = resolveCell(context);
      if (!atlas) return null;
      const animated = originalAmbientLayer(context);
      return {
        layers: [
          animated ?? {
            kind: "atlas",
            column: atlas.column,
            row: atlas.row,
          },
        ],
      };
    },
  };
}

/** 以脚底格为唯一 Presence，向上组合原版直立双格素材。 */
export function uprightAtlasVisual(
  definition: EntityModuleDefinition,
  head: AtlasCell,
  body: AtlasCell,
): VisualDefinition {
  if (body.column !== head.column || body.row !== head.row + 1)
    throw new Error("直立双格素材必须是 atlas 中纵向连续的 head/body");
  return {
    id: definition.presentation.visual ?? definition.type,
    resolve() {
      return {
        layers: [{
          kind: "atlas",
          column: head.column,
          row: head.row,
          rows: 2,
          anchor: "bottom",
        }],
      };
    },
  };
}

export function staticEntity(
  definition: EntityModuleDefinition,
  atlas: AtlasCell,
  behaviorBindings: readonly EntityBehaviorBinding[] = [],
): EntityModule {
  return originalModule(
    definition,
    atlasVisual(definition, atlas),
    behaviorBindings,
  );
}

export const pressedState: readonly EntityFieldDefinition[] = [
  { key: "pressed", kind: "boolean", label: "按下", default: false },
];

export function activeState(defaultValue = false): readonly EntityFieldDefinition[] {
  return [{ key: "active", kind: "boolean", label: "激活", default: defaultValue }];
}

export function variantState(values: readonly (string | number)[]): readonly EntityFieldDefinition[] {
  return [
    {
      key: "variant",
      kind: "enum",
      label: "形态",
      default: values[0]!,
      options: values.map((value) => ({ value })),
    },
  ];
}

export function directionCell(
  direction: Direction | undefined,
  up: AtlasCell,
  down: AtlasCell,
  left: AtlasCell,
  right: AtlasCell,
): AtlasCell {
  return { up, down, left, right }[direction ?? "right"];
}

export function boundedInt(
  value: JsonValue | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export function clampProgress(value: number): number {
  return Math.max(0, Math.min(0.999999, value));
}

function originalAmbientLayer(
  context: VisualResolveContext,
): ImageVisualLayer | null {
  if (!context.time) return null;
  if (context.entity.type === MapEntityTypeId.BONUS_COIN) {
    const frame = context.ambient?.bonusCoinSparkleFrame;
    if (frame === null || frame === undefined) return null;
    return originalAnimationFrame({ type: MapEntityTypeId.BONUS_COIN, id: "ambient" }, frame);
  }
  const selector = originalAmbientSelector(
    context.entity.type,
    context.entity.direction,
    context.entity.state?.variant,
  );
  return selector
    ? originalAmbientAnimationLayer(selector, context.time.nowMs)
    : null;
}

/** 原版 ta.png ambient 序列按 Presentation 毫秒取样，phase 0 使用静态 ts.png。 */
export function originalAmbientAnimationLayer(
  selector: Parameters<typeof originalTileAnimation>[0],
  nowMs: number,
): ImageVisualLayer | null {
  const frames = originalTileAnimation(selector).frames;
  if (frames.some((frame) => frame.atlas !== "ta")) {
    throw new Error(`原版 ambient 动画必须使用 ta.png：${selector.type}/${selector.id}`);
  }
  const cycleLength = frames.length + 1;
  const phase = originalAmbientPhase(nowMs, cycleLength);
  if (phase === 0) return null;
  const source = frames[phase - 1]!;
  return {
    kind: "image",
    asset: ORIGINAL_GAMEPLAY_IMAGE_IDS.animatedTiles,
    frameWidth: ORIGINAL_TILE_SIZE,
    frameHeight: ORIGINAL_TILE_SIZE,
    frameIndex:
      (source.row - 1) * ORIGINAL_TILE_ATLASES.ta.columns + source.column - 1,
    anchor: "fill",
  };
}

function originalAmbientSelector(
  type: EntityType,
  direction: Direction | undefined,
  variant: JsonValue | undefined,
): Parameters<typeof originalTileAnimation>[0] | null {
  let selector: Parameters<typeof originalTileAnimation>[0] | null = null;
  if (type === MapEntityTypeId.WHIRLWIND) {
    selector = { type, id: "ambient" };
  } else if (type === MapEntityTypeId.WATER && variant === "ripple") {
    selector = { type, id: "ambient", fields: { variant: "ripple" } };
  } else if (type === MapEntityTypeId.WATERFALL) {
    selector = { type, id: "ambient", fields: { variant: String(variant) } };
  } else if (type === MapEntityTypeId.SPEED || type === MapEntityTypeId.TIDE) {
    selector = { type, id: "ambient", fields: { direction: direction ?? "right" } };
  }
  return selector;
}

function originalAnimationFrame(
  selector: Parameters<typeof originalTileAnimation>[0],
  frame: number,
): ImageVisualLayer | null {
  const source = originalTileAnimation(selector).frames[frame];
  if (!source || source.atlas !== "ta") return null;
  return {
    kind: "image",
    asset: ORIGINAL_GAMEPLAY_IMAGE_IDS.animatedTiles,
    frameWidth: ORIGINAL_TILE_SIZE,
    frameHeight: ORIGINAL_TILE_SIZE,
    frameIndex:
      (source.row - 1) * ORIGINAL_TILE_ATLASES.ta.columns + source.column - 1,
    anchor: "fill",
  };
}
