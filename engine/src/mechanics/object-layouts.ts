import type { LevelObject, ObjectType } from "../data/types.js";
import { ObjectId } from "./ids.js";

export interface ObjectLayoutCell {
  dx: number;
  dy: number;
  type: ObjectType;
}

export interface ObjectLayout {
  /** Occupied runtime cells, including the persisted anchor at 0,0. */
  cells: readonly ObjectLayoutCell[];
  /** Editor cursor position relative to the persisted anchor. */
  cursor: { dx: number; dy: number };
}

const SINGLE_CURSOR = { dx: 0, dy: 0 } as const;

const MULTI_CELL_LAYOUTS = new Map<ObjectType, ObjectLayout>([
  [
    ObjectId.DRAGON_HEAD_BASE,
    {
      cells: [
        { dx: 0, dy: 0, type: ObjectId.DRAGON_HEAD_BASE },
        { dx: 1, dy: 0, type: ObjectId.DRAGON_BODY },
        { dx: 2, dy: 0, type: ObjectId.DRAGON_TAIL },
      ],
      cursor: { dx: 1, dy: 0 },
    },
  ],
  [
    ObjectId.SANDMAN,
    {
      cells: [
        { dx: 0, dy: 0, type: ObjectId.SANDMAN },
        { dx: 0, dy: 1, type: ObjectId.SANDMAN_BODY },
      ],
      cursor: SINGLE_CURSOR,
    },
  ],
  [
    ObjectId.DREAM_MACHINE,
    {
      cells: [
        { dx: 0, dy: 0, type: ObjectId.DREAM_MACHINE },
        { dx: 0, dy: 1, type: ObjectId.DREAM_MACHINE_BODY },
      ],
      cursor: SINGLE_CURSOR,
    },
  ],
  [
    ObjectId.BEAVER_BASE,
    {
      cells: [
        { dx: 0, dy: 0, type: ObjectId.BEAVER_BASE },
        { dx: 0, dy: 1, type: ObjectId.BEAVER_BODY },
      ],
      cursor: SINGLE_CURSOR,
    },
  ],
]);

const INTERNAL_PARTS = new Set<ObjectType>(
  [...MULTI_CELL_LAYOUTS.values()].flatMap((layout) =>
    layout.cells.slice(1).map((cell) => cell.type),
  ),
);

/**
 * Editor-authoring variant cycles. These are semantic alternatives, not runtime animation states.
 * A positive step corresponds to E / wheel-down; a negative step corresponds to Q / wheel-up.
 */
const VARIANT_CYCLES: readonly (readonly ObjectType[])[] = [
  [
    ObjectId.WINDMILL_UP,
    ObjectId.WINDMILL_RIGHT,
    ObjectId.WINDMILL_DOWN,
    ObjectId.WINDMILL_LEFT,
  ],
  [
    ObjectId.FENCE_1,
    ObjectId.FENCE_2,
    ObjectId.FENCE_3,
    ObjectId.FENCE_4,
    ObjectId.FENCE_5,
    ObjectId.FENCE_6,
  ],
  [ObjectId.CLOUD_RED, ObjectId.CLOUD_PURPLE, ObjectId.CLOUD_GREEN],
  [
    ObjectId.CLOUD_GRID_RED,
    ObjectId.CLOUD_GRID_PURPLE,
    ObjectId.CLOUD_GRID_GREEN,
  ],
];

const VARIANT_LOOKUP = new Map<ObjectType, readonly ObjectType[]>();
for (const cycle of VARIANT_CYCLES)
  for (const type of cycle) VARIANT_LOOKUP.set(type, cycle);

/** Semantic layout for one persisted Object anchor. 1×1 objects return a synthetic single-cell layout. */
export function objectLayoutFor(type: ObjectType): ObjectLayout {
  return (
    MULTI_CELL_LAYOUTS.get(type) ?? {
      cells: [{ dx: 0, dy: 0, type }],
      cursor: SINGLE_CURSOR,
    }
  );
}

export function isMultiCellObject(type: ObjectType): boolean {
  return MULTI_CELL_LAYOUTS.has(type);
}

export function isObjectLayoutPart(type: ObjectType): boolean {
  return INTERNAL_PARTS.has(type);
}

export function objectVariantCycle(
  type: ObjectType,
): readonly ObjectType[] | undefined {
  return VARIANT_LOOKUP.get(type);
}

export function transformObjectVariant(
  type: ObjectType,
  step: number,
): ObjectType | undefined {
  const cycle = objectVariantCycle(type);
  if (!cycle || cycle.length < 2 || step === 0) return undefined;
  const index = cycle.indexOf(type);
  if (index < 0) return undefined;
  const offset = step > 0 ? 1 : -1;
  return cycle[(index + offset + cycle.length) % cycle.length];
}

/** Expand persisted anchor objects into the occupancy objects consumed by the current Engine runtime. */
export function expandObjectLayouts(
  objects: readonly LevelObject[],
  width: number,
  height: number,
): LevelObject[] {
  const expanded: LevelObject[] = [];
  const occupied = new Set<string>();
  for (const anchor of objects) {
    for (const cell of objectLayoutFor(anchor.type).cells) {
      const x = anchor.x + cell.dx;
      const y = anchor.y + cell.dy;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const key = `${x},${y}`;
      if (occupied.has(key)) continue;
      occupied.add(key);
      expanded.push({
        type: cell.type,
        x,
        y,
        ...(anchor.properties
          ? { properties: { ...anchor.properties } }
          : {}),
      });
    }
  }
  return expanded;
}

/**
 * Collapse a runtime occupancy list back to authoring anchors. Internal layout parts are omitted;
 * anchor objects remain exactly where the original DAT stores them.
 */
export function collapseObjectLayouts(
  objects: readonly LevelObject[],
): LevelObject[] {
  return objects
    .filter((object) => !isObjectLayoutPart(object.type))
    .map((object) => ({
      type: object.type,
      x: object.x,
      y: object.y,
      ...(object.properties
        ? { properties: { ...object.properties } }
        : {}),
    }));
}
