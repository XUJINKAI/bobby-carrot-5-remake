import {
  MapEntityTypeId,
  ORIGINAL_TILE_ATLASES,
  originalTileAnimation,
  originalTileVisual,
  type JsonPrimitive,
  type OriginalTileCoordinate,
  type OriginalTileSource,
  type Direction,
  type EntityType,
  type JsonValue,
} from "@bobby/model";
import type { EntityFieldDefinition } from "../../world/entity/EntityDefinition.js";
import type { WinConditionState } from "../../world/WorldTypes.js";
import type {
  ImageVisualLayer,
  VisualDefinition,
  VisualResolveContext,
} from "../../visual/VisualDefinition.js";
import { behaviorBindingsForDefinition } from "../behaviorLibrary.js";
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

interface OriginalAmbientSequence {
  frames: readonly OriginalTileSource[];
}

const ORIGINAL_ANIMATED_TILES_ASSET = "original-animated-tiles";
const ORIGINAL_AMBIENT_FRAME_MS = 248;
const ORIGINAL_TILE_SIZE = 48;

export const SURFACE_STACK_ORDER = 0;
export const CONTENT_STACK_ORDER = 100;
export const COVER_STACK_ORDER = 200;

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
    behaviorBindings: [
      ...behaviorBindingsForDefinition(definition),
      ...behaviorBindings,
    ],
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
  if (
    context.entity.type === MapEntityTypeId.EXIT &&
    !exitAnimationReady(context.winState)
  )
    return null;
  const sequence = originalAmbientSequence(
    context.entity.type,
    context.entity.direction,
    context.entity.state?.variant,
  );
  if (!sequence) return null;
  const cycleLength = sequence.frames.length + 1;
  const phase =
    Math.floor(Math.max(0, context.time.nowMs) / ORIGINAL_AMBIENT_FRAME_MS) %
    cycleLength;
  if (phase === 0) return null;
  const source = sequence.frames[phase - 1]!;
  return {
    kind: "image",
    asset: ORIGINAL_ANIMATED_TILES_ASSET,
    frameWidth: ORIGINAL_TILE_SIZE,
    frameHeight: ORIGINAL_TILE_SIZE,
    frameIndex:
      (source.row - 1) * ORIGINAL_TILE_ATLASES.ta.columns + source.column - 1,
    anchor: "fill",
  };
}

function originalAmbientSequence(
  type: EntityType,
  direction: Direction | undefined,
  variant: JsonValue | undefined,
): OriginalAmbientSequence | null {
  let selector: Parameters<typeof originalTileAnimation>[0] | null = null;
  if (
    type === MapEntityTypeId.EXIT ||
    type === MapEntityTypeId.BONUS_COIN ||
    type === MapEntityTypeId.WHIRLWIND
  ) {
    selector = { type, id: "ambient" };
  } else if (type === MapEntityTypeId.WINDMILL) {
    selector = windmillAnimation(direction ?? "right");
  } else if (type === MapEntityTypeId.WATER && variant === "ripple") {
    selector = { type, id: "ambient", fields: { variant: "ripple" } };
  } else if (type === MapEntityTypeId.WATERFALL) {
    selector = { type, id: "ambient", fields: { variant: String(variant) } };
  } else if (type === MapEntityTypeId.SPEED || type === MapEntityTypeId.TIDE) {
    selector = { type, id: "ambient", fields: { direction: direction ?? "right" } };
  }
  if (!selector) return null;
  const frames = originalTileAnimation(selector).frames;
  if (frames.some((frame) => frame.atlas !== "ta")) {
    throw new Error(`原版 ambient 动画必须使用 ta.png：${selector.type}/${selector.id}`);
  }
  return { frames };
}

function windmillAnimation(
  direction: Direction,
): Parameters<typeof originalTileAnimation>[0] {
  return {
    type: MapEntityTypeId.WINDMILL,
    id: "ambient",
    fields: { direction },
  };
}

function exitAnimationReady(
  state: Readonly<WinConditionState> | null | undefined,
): boolean {
  if (!state || state.completed) return false;
  if (state.type === "reach")
    return state.target === MapEntityTypeId.EXIT;
  if (state.type !== "all") return false;

  let pendingExit = false;
  for (const condition of state.conditions) {
    if (condition.completed) continue;
    if (!exitAnimationReady(condition)) return false;
    pendingExit = true;
  }
  return pendingExit;
}
