import {
  EntityTypeId,
  type Direction,
  type EntityType,
  type JsonValue,
} from "@bobby/model";
import type { EntityFieldDefinition } from "../../world/entity/EntityDefinition.js";
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
  baseIndex: number;
  cycleLength: number;
}

const ORIGINAL_ANIMATED_TILES_ASSET = "original-animated-tiles";
const ORIGINAL_AMBIENT_FRAME_MS = 248;
const ORIGINAL_TILE_SIZE = 48;

export const SURFACE_STACK_ORDER = 0;
export const CONTENT_STACK_ORDER = 100;
export const COVER_STACK_ORDER = 200;

export const cell = (column: number, row: number): AtlasCell => ({ column, row });

export function objectCell(index: number): AtlasCell {
  const linear = 9 + index;
  return cell(linear % 16, 12 + Math.floor(linear / 16));
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
  const sequence = originalAmbientSequence(
    context.entity.type,
    context.entity.direction,
  );
  if (!sequence) return null;
  const phase =
    Math.floor(Math.max(0, context.time.nowMs) / ORIGINAL_AMBIENT_FRAME_MS) %
    sequence.cycleLength;
  if (phase === 0) return null;
  return {
    kind: "image",
    asset: ORIGINAL_ANIMATED_TILES_ASSET,
    frameWidth: ORIGINAL_TILE_SIZE,
    frameHeight: ORIGINAL_TILE_SIZE,
    frameIndex: sequence.baseIndex + phase - 1,
    anchor: "fill",
  };
}

function originalAmbientSequence(
  type: EntityType,
  direction: Direction | undefined,
): OriginalAmbientSequence | null {
  if (type === EntityTypeId.EXIT) return { baseIndex: 0, cycleLength: 4 };
  if (type === EntityTypeId.BONUS_COIN)
    return { baseIndex: 15, cycleLength: 4 };
  if (type === EntityTypeId.WINDMILL_UP)
    return { baseIndex: 18, cycleLength: 3 };
  if (type === EntityTypeId.WINDMILL_DOWN)
    return { baseIndex: 20, cycleLength: 3 };
  if (type === EntityTypeId.WINDMILL_LEFT)
    return { baseIndex: 22, cycleLength: 3 };
  if (type === EntityTypeId.WINDMILL_RIGHT)
    return { baseIndex: 24, cycleLength: 3 };
  if (type === EntityTypeId.WHIRLWIND)
    return { baseIndex: 26, cycleLength: 6 };
  if (type === EntityTypeId.WATER_ANIMATED)
    return { baseIndex: 39, cycleLength: 8 };
  if (type === EntityTypeId.WATER_VARIANT_1)
    return { baseIndex: 46, cycleLength: 3 };
  if (type === EntityTypeId.WATER_VARIANT_2)
    return { baseIndex: 48, cycleLength: 3 };
  if (type === EntityTypeId.WATER_VARIANT_3)
    return { baseIndex: 50, cycleLength: 3 };
  if (type === EntityTypeId.SPEED) {
    const baseIndex = { up: 3, down: 6, left: 9, right: 12 }[
      direction ?? "right"
    ];
    return { baseIndex, cycleLength: 4 };
  }
  if (type === EntityTypeId.TIDE) {
    const baseIndex = { up: 31, down: 33, left: 35, right: 37 }[
      direction ?? "right"
    ];
    return { baseIndex, cycleLength: 3 };
  }
  return null;
}
