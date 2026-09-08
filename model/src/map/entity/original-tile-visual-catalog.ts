import catalogJson from "./original-tile-visuals.json" with { type: "json" };
import type { JsonPrimitive } from "../../shared/json.js";

export type OriginalTilePanel = "surface" | "palette";
export type OriginalTileAtlasId = "ts" | "ta";

export interface OriginalTileCoordinate {
  row: number;
  column: number;
}

export interface OriginalTileSource extends OriginalTileCoordinate {
  atlas: OriginalTileAtlasId;
  cell: string;
}

export interface OriginalTileAtlasDefinition {
  id: OriginalTileAtlasId;
  file: string;
  columns: number;
  rows: number;
}

export interface OriginalTileVisualDefinition extends OriginalTileSource {
  panel: OriginalTilePanel;
  type: string;
  note: string;
  fields: Readonly<Record<string, JsonPrimitive>>;
  role?: string;
  phase?: string;
  name: string;
}

export interface OriginalTileAnimationDefinition {
  id: string;
  panel: OriginalTilePanel;
  type: string;
  fields: Readonly<Record<string, JsonPrimitive>>;
  role?: string;
  frames: readonly OriginalTileSource[];
}

export interface OriginalTileVisualGroupDefinition {
  panel: OriginalTilePanel;
  type: string;
  note: string;
  visuals: readonly OriginalTileVisualDefinition[];
  animations: readonly OriginalTileAnimationDefinition[];
}

export interface OriginalTileVisualSelector {
  type: string;
  fields?: Readonly<Record<string, JsonPrimitive>>;
  role?: string;
  phase?: string;
}

export interface OriginalTileAnimationSelector {
  type: string;
  id: string;
  fields?: Readonly<Record<string, JsonPrimitive>>;
  role?: string;
}

interface RawAnimation {
  id: string;
  atlas: string;
  role?: string;
  frames: string[];
}

interface RawVariant {
  fields: Record<string, JsonPrimitive>;
  cell: string;
  animations?: RawAnimation[];
}

interface RawGroup {
  type: string;
  note: string;
  base?: string;
  coordinateVariants?: string[];
  variants?: RawVariant[];
  parts?: Record<string, string>;
  phases?: Record<string, string>;
  animations?: RawAnimation[];
}

interface RawCatalog {
  schemaVersion: number;
  atlases: Record<string, {
    file: string;
    columns: number;
    rows: number;
  }>;
  surface: RawGroup[];
  palette: RawGroup[];
}

const rawCatalog = catalogJson as unknown as RawCatalog;
validateCatalogRoot(rawCatalog);

export const ORIGINAL_TILE_ATLASES = Object.freeze(
  Object.fromEntries(
    Object.entries(rawCatalog.atlases).map(([id, atlas]) => [
      id,
      Object.freeze({ id, ...atlas }),
    ]),
  ),
) as Readonly<Record<OriginalTileAtlasId, OriginalTileAtlasDefinition>>;

const groups: OriginalTileVisualGroupDefinition[] = [];
const atlasCells = new Map<string, OriginalTileVisualDefinition>();

for (const panel of ["surface", "palette"] as const) {
  for (const rawGroup of rawCatalog[panel]) {
    const visuals: OriginalTileVisualDefinition[] = [];
    const animations: OriginalTileAnimationDefinition[] = [];
    const addVisual = (
      cell: string,
      options: {
        fields?: Readonly<Record<string, JsonPrimitive>>;
        role?: string;
        phase?: string;
      } = {},
    ): void => {
      const fields = Object.freeze({ ...(options.fields ?? {}) });
      const visual = Object.freeze({
        ...parseSource("ts", cell),
        panel,
        type: rawGroup.type,
        note: rawGroup.note,
        fields,
        ...(options.role ? { role: options.role } : {}),
        ...(options.phase ? { phase: options.phase } : {}),
        name: visualName(rawGroup.type, fields, options.role, options.phase),
      });
      registerAtlasCell(atlasCells, visual);
      visuals.push(visual);
    };
    const addAnimations = (
      source: readonly RawAnimation[] | undefined,
      fields: Readonly<Record<string, JsonPrimitive>> = {},
    ): void => {
      for (const animation of source ?? []) {
        const atlas = requireAtlasId(animation.atlas);
        const frames = animation.frames.map((cell) => parseSource(atlas, cell));
        for (const [index, frame] of frames.entries()) {
          if (frame.atlas !== "ts") continue;
          const visual = Object.freeze({
            ...frame,
            panel,
            type: rawGroup.type,
            note: rawGroup.note,
            fields: Object.freeze({ ...fields }),
            ...(animation.role ? { role: animation.role } : {}),
            phase: `${animation.id}-${index + 1}`,
            name: `${rawGroup.type}-${animation.id}-${index + 1}`,
          });
          registerAtlasCell(atlasCells, visual);
          visuals.push(visual);
        }
        animations.push(Object.freeze({
          id: animation.id,
          panel,
          type: rawGroup.type,
          fields: Object.freeze({ ...fields }),
          ...(animation.role ? { role: animation.role } : {}),
          frames: Object.freeze(frames),
        }));
      }
    };

    if (rawGroup.base) addVisual(rawGroup.base);
    for (const cell of rawGroup.coordinateVariants ?? []) {
      addVisual(cell, { fields: { variant: originalTileCoordinateLabel(parseCell(cell)) } });
    }
    for (const variant of rawGroup.variants ?? []) {
      addVisual(variant.cell, { fields: variant.fields });
      addAnimations(variant.animations, variant.fields);
    }
    for (const [role, cell] of Object.entries(rawGroup.parts ?? {})) {
      addVisual(cell, { role });
    }
    for (const [phase, cell] of Object.entries(rawGroup.phases ?? {})) {
      addVisual(cell, { phase });
    }
    addAnimations(rawGroup.animations);

    groups.push(Object.freeze({
      panel,
      type: rawGroup.type,
      note: rawGroup.note,
      visuals: Object.freeze(visuals),
      animations: Object.freeze(animations),
    }));
  }
}

export const ORIGINAL_TILE_VISUAL_GROUPS = Object.freeze(groups);
export const ORIGINAL_TILE_VISUALS = Object.freeze(groups.flatMap((group) => group.visuals));
export const ORIGINAL_TILE_ANIMATIONS = Object.freeze(
  groups.flatMap((group) => group.animations),
);

validateNormalizedCatalog();

export function originalTileVisualGroup(
  type: string,
): OriginalTileVisualGroupDefinition {
  const group = ORIGINAL_TILE_VISUAL_GROUPS.find((candidate) => candidate.type === type);
  if (!group) throw new Error(`原版 Tile Visual 目录缺少类型：${type}`);
  return group;
}

export function originalTileVisualGroups(
  panel: OriginalTilePanel,
): readonly OriginalTileVisualGroupDefinition[] {
  return ORIGINAL_TILE_VISUAL_GROUPS.filter((group) => group.panel === panel);
}

export function originalTileVisual(
  selector: OriginalTileVisualSelector,
): OriginalTileVisualDefinition {
  const fields = selector.fields ?? {};
  const candidates = originalTileVisualGroup(selector.type).visuals.filter((visual) =>
    sameFields(visual.fields, fields) &&
    visual.role === selector.role &&
    visual.phase === selector.phase
  );
  if (candidates.length !== 1) {
    throw new Error(
      `原版 Tile Visual selector 必须唯一匹配：${JSON.stringify(selector)}`,
    );
  }
  return candidates[0]!;
}

export function originalTileAnimation(
  selector: OriginalTileAnimationSelector,
): OriginalTileAnimationDefinition {
  const fields = selector.fields ?? {};
  const candidates = originalTileVisualGroup(selector.type).animations.filter((animation) =>
    animation.id === selector.id &&
    sameFields(animation.fields, fields) &&
    animation.role === selector.role
  );
  if (candidates.length !== 1) {
    throw new Error(
      `原版 Tile Animation selector 必须唯一匹配：${JSON.stringify(selector)}`,
    );
  }
  return candidates[0]!;
}

export function originalTileAtlasCell(
  atlas: OriginalTileAtlasId,
  row: number,
  column: number,
): OriginalTileVisualDefinition | undefined {
  return atlasCells.get(atlasCellKey(atlas, { row, column }));
}

export function originalTileCoordinateLabel(
  source: OriginalTileCoordinate,
): string {
  return `ts-${source.row}-${source.column}`;
}

export function parseOriginalTileCoordinateLabel(
  value: string,
): OriginalTileCoordinate | undefined {
  const match = /^ts-(\d+)-(\d+)$/.exec(value);
  if (!match) return undefined;
  const coordinate = { row: Number(match[1]), column: Number(match[2]) };
  return isOriginalTileCoordinate("ts", coordinate.row, coordinate.column)
    ? coordinate
    : undefined;
}

export function isOriginalTileCoordinate(
  atlas: OriginalTileAtlasId,
  row: number,
  column: number,
): boolean {
  const definition = ORIGINAL_TILE_ATLASES[atlas];
  return Number.isInteger(row) && Number.isInteger(column) &&
    row >= 1 && row <= definition.rows &&
    column >= 1 && column <= definition.columns;
}

function validateCatalogRoot(value: RawCatalog): void {
  if (value.schemaVersion !== 1) {
    throw new Error("原版 Tile Visual 目录只支持 schemaVersion: 1");
  }
  if (!Array.isArray(value.surface) || !Array.isArray(value.palette)) {
    throw new Error("原版 Tile Visual 目录必须定义 surface 与 palette");
  }
  for (const id of ["ts", "ta"] as const) {
    const atlas = value.atlases?.[id];
    if (!atlas || !Number.isInteger(atlas.columns) || !Number.isInteger(atlas.rows)) {
      throw new Error(`原版 Tile Visual 目录缺少 atlas：${id}`);
    }
  }
  for (const panel of ["surface", "palette"] as const) {
    for (const group of value[panel]) validateRawGroup(group, panel);
  }
}

function validateRawGroup(group: RawGroup, panel: OriginalTilePanel): void {
  if (!group.type || !group.note) {
    throw new Error(`原版 Tile Visual ${panel} 条目必须定义 type 与 note`);
  }
  const primaryForms = [
    group.base !== undefined,
    group.coordinateVariants !== undefined,
    group.variants !== undefined,
    group.parts !== undefined,
  ].filter(Boolean).length;
  if (primaryForms !== 1) {
    throw new Error(
      `原版 Tile Visual ${group.type} 必须且只能使用 base、coordinateVariants、variants、parts 之一`,
    );
  }
  if (group.coordinateVariants && group.coordinateVariants.length === 0) {
    throw new Error(`原版 Tile Visual ${group.type}.coordinateVariants 不能为空`);
  }
  if (group.variants) {
    if (group.variants.length === 0)
      throw new Error(`原版 Tile Visual ${group.type}.variants 不能为空`);
    for (const variant of group.variants) {
      if (Object.keys(variant.fields).length === 0)
        throw new Error(`原版 Tile Visual ${group.type}.variants.fields 不能为空`);
    }
  }
  if (group.parts && Object.keys(group.parts).length === 0)
    throw new Error(`原版 Tile Visual ${group.type}.parts 不能为空`);
  if (group.phases && Object.keys(group.phases).length === 0)
    throw new Error(`原版 Tile Visual ${group.type}.phases 不能为空`);
  for (const animation of [
    ...(group.animations ?? []),
    ...(group.variants ?? []).flatMap((variant) => variant.animations ?? []),
  ]) {
    if (!animation.id || animation.frames.length === 0)
      throw new Error(`原版 Tile Visual ${group.type}.animations 必须定义 id 与 frames`);
  }
}

function validateNormalizedCatalog(): void {
  const types = ORIGINAL_TILE_VISUAL_GROUPS.map((group) => group.type);
  if (new Set(types).size !== types.length) {
    throw new Error("原版 Tile Visual 目录包含重复 type");
  }
  const tsAtlas = ORIGINAL_TILE_ATLASES.ts;
  const expected = tsAtlas.columns * tsAtlas.rows;
  const tsCells = ORIGINAL_TILE_VISUALS.filter((visual) => visual.atlas === "ts");
  if (tsCells.length !== expected) {
    throw new Error(`ts.png 必须恰好登记 ${expected} 个单元，当前为 ${tsCells.length}`);
  }
  for (let row = 1; row <= tsAtlas.rows; row += 1) {
    for (let column = 1; column <= tsAtlas.columns; column += 1) {
      if (!originalTileAtlasCell("ts", row, column)) {
        throw new Error(`ts.png 缺少单元：${row}-${column}`);
      }
    }
  }
  const taAtlas = ORIGINAL_TILE_ATLASES.ta;
  const taFrameKeys = ORIGINAL_TILE_ANIMATIONS.flatMap((animation) =>
    animation.frames
      .filter((frame) => frame.atlas === "ta")
      .map((frame) => atlasCellKey("ta", frame))
  );
  const expectedTaFrames = taAtlas.columns * taAtlas.rows;
  if (
    taFrameKeys.length !== expectedTaFrames ||
    new Set(taFrameKeys).size !== expectedTaFrames
  ) {
    throw new Error(
      `ta.png 必须由动画恰好覆盖 ${expectedTaFrames} 个单元，当前为 ${taFrameKeys.length}`,
    );
  }
  const selectors = ORIGINAL_TILE_VISUALS.map((visual) => selectorKey(visual));
  if (new Set(selectors).size !== selectors.length) {
    throw new Error("原版 Tile Visual 目录包含重复 selector");
  }
  const animations = ORIGINAL_TILE_ANIMATIONS.map((animation) => JSON.stringify({
    type: animation.type,
    id: animation.id,
    fields: Object.entries(animation.fields).sort(([left], [right]) =>
      left.localeCompare(right)
    ),
    role: animation.role,
  }));
  if (new Set(animations).size !== animations.length) {
    throw new Error("原版 Tile Visual 目录包含重复 animation selector");
  }
}

function registerAtlasCell(
  target: Map<string, OriginalTileVisualDefinition>,
  visual: OriginalTileVisualDefinition,
): void {
  const key = atlasCellKey(visual.atlas, visual);
  if (target.has(key)) throw new Error(`原版 Tile Visual 目录重复登记：${key}`);
  target.set(key, visual);
}

function parseSource(atlas: OriginalTileAtlasId, cell: string): OriginalTileSource {
  return { atlas, cell, ...parseCell(cell, atlas) };
}

function parseCell(
  value: string,
  atlas: OriginalTileAtlasId = "ts",
): OriginalTileCoordinate {
  const match = /^(\d+)-(\d+)$/.exec(value);
  const row = Number(match?.[1]);
  const column = Number(match?.[2]);
  if (!match || !isOriginalTileCoordinate(atlas, row, column)) {
    throw new Error(`原版 Tile Visual 坐标无效：${atlas}:${value}`);
  }
  return { row, column };
}

function requireAtlasId(value: string): OriginalTileAtlasId {
  if (value !== "ts" && value !== "ta") {
    throw new Error(`原版 Tile Visual atlas 无效：${value}`);
  }
  return value;
}

function sameFields(
  left: Readonly<Record<string, JsonPrimitive>>,
  right: Readonly<Record<string, JsonPrimitive>>,
): boolean {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return leftEntries.length === rightEntries.length &&
    leftEntries.every(([key, value]) => right[key] === value);
}

function visualName(
  type: string,
  fields: Readonly<Record<string, JsonPrimitive>>,
  role?: string,
  phase?: string,
): string {
  if (role) return `${type}-${role}`;
  if (phase) return `${type}-${phase}`;
  const suffix = Object.entries(fields)
    .map(([key, value]) => fieldVisualName(key, value))
    .filter((value) => !value.startsWith("ts-"));
  return suffix.length > 0 ? `${type}-${suffix.join("-")}` : type;
}

function fieldVisualName(key: string, value: JsonPrimitive): string {
  if (key === "pressed" && typeof value === "boolean")
    return value ? "pressed" : "raised";
  if (key === "active" && typeof value === "boolean")
    return value ? "active" : "inactive";
  if (key === "raised" && typeof value === "boolean")
    return value ? "raised" : "lowered";
  return String(value);
}

function selectorKey(visual: OriginalTileVisualDefinition): string {
  return JSON.stringify({
    type: visual.type,
    fields: Object.entries(visual.fields).sort(([left], [right]) => left.localeCompare(right)),
    role: visual.role,
    phase: visual.phase,
  });
}

function atlasCellKey(
  atlas: OriginalTileAtlasId,
  coordinate: OriginalTileCoordinate,
): string {
  return `${atlas}:${coordinate.row}-${coordinate.column}`;
}
