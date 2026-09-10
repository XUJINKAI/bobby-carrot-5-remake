import type {
  EntityCatalog,
  VisualDefinition,
} from "@bobby/engine";
import type {
  EntityType,
  JsonPrimitive,
  LevelEntity,
} from "@bobby/model";
import type { Cell } from "../authoring/entityPlacement.js";
import type { EditorMap, EntityRef, LevelValidationIssue } from "../level/types.js";

/** Stable Editor interaction modes. Concrete Entity knowledge must not leak into this type. */
export type EditorTool = "select" | "place" | "erase";

/** Editor 专用 preset/variant 携带的扁平 Map 持久化字段。 */
export type EditorEntityFields = Readonly<Record<string, JsonPrimitive>>;

/** What the Editor Core should create when the current placement action is committed. */
export interface EditorPlacementPreset {
  type: EntityType;
  /** 与 LevelEntity 一致，direction 等类型专属参数统一放在 fields 中。 */
  fields?: EditorEntityFields;
}

/** Rectangular cell selection; the rectangle is derived from anchor/focus. */
export interface EditorSelection {
  anchor: Cell;
  focus: Cell;
}

/** Clipboard entities use coordinates relative to the copied rectangle's top-left corner. */
export interface EditorClipboard {
  width: number;
  height: number;
  entities: readonly LevelEntity[];
}

export type EditorPlacementPoint =
  | { role: string }
  | { offset: { dx: number; dy: number } };

export interface EditorEntityVariant {
  label?: string;
  fields?: EditorEntityFields;
}

export interface EditorQuickAction {
  id: string;
  label: string;
  apply(entity: Readonly<LevelEntity>): LevelEntity;
}

export type EditorStackSlot =
  | "surface-base"
  | "surface-overlay"
  | "floor-feature"
  | "content"
  | "support"
  | "occupant"
  | "cover";

export interface EditorStackingDefinition {
  /** 不同 slot 的推荐共存组合；同 slot 始终执行替换。 */
  compatibleSlots: readonly (readonly [EditorStackSlot, EditorStackSlot])[];
}

/** Entity 专属创作策略；只属于 Editor，不进入 Engine。 */
export interface EditorEntityDefinition {
  placementPoint?: EditorPlacementPoint;
  defaultFields?: EditorEntityFields;
  stackSlot?: EditorStackSlot;
  variants?: readonly EditorEntityVariant[];
  quickActions?: readonly EditorQuickAction[];
  editorVisual?: VisualDefinition["resolve"];
}

export type EditorEntityExclusion =
  | EntityType
  | { prefix: string };

export interface EditorPalettePreview {
  fields?: EditorEntityFields;
  /** 只注入缩略图的 Runtime state，不进入 EditorPlacementPreset 或 LevelMap。 */
  state?: EditorEntityFields;
}

export type EditorPaletteExpansion = "variants";

export interface EditorPaletteEntry extends EditorPlacementPreset {
  /** 未指定时严格保留一个表条目；variants 按 Editor Entity Definition 顺序展开。 */
  expand?: EditorPaletteExpansion;
  label?: string;
  /** 只覆盖 Palette 外观，不改变实际放置的字段。 */
  preview?: EditorPalettePreview;
}

export interface EditorPaletteGroup {
  id: string;
  label: string;
  rows: readonly (readonly EditorPaletteEntry[])[];
}

export interface EditorPaletteRemainderGroup {
  id: string;
  label: string;
  /** 省略时接收此前分组未消费的全部可创建 Entity。 */
  types?: readonly EntityType[];
  expand?: EditorPaletteExpansion;
  rows: "single" | "by-type";
  sort?: "type";
}

export interface EditorPaletteDefinition {
  groups: readonly EditorPaletteGroup[];
  /** remainder 按声明顺序消费未进入显式 rows 的 Entity。 */
  remainders?: readonly EditorPaletteRemainderGroup[];
}

export interface EditorDeletionCandidate {
  ref: EntityRef;
  entity: Readonly<LevelEntity>;
  role?: string;
  stackOrder: number;
  traits: readonly string[];
}

export interface EditorDeleteContext {
  map: Readonly<EditorMap>;
  cell: Cell;
  candidates: readonly EditorDeletionCandidate[];
}

export interface EditorDeletionDefinition {
  resolveTarget(context: EditorDeleteContext): EntityRef | null;
}

export interface EditorValidationContext {
  map: Readonly<EditorMap>;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}

export type EditorMapValidator = (
  context: EditorValidationContext,
) => readonly LevelValidationIssue[];

/**
 * The only configurable definition bundle consumed by Editor Core.
 * Palette organization, Entity authoring policy, deletion policy and game-specific validation
 * can evolve without changing selection/history/canvas/clipboard algorithms.
 */
export interface EditorDefinition {
  /** Engine-known types matching these selectors cannot be created through normal Editor tools. */
  exclude?: readonly EditorEntityExclusion[];
  entities?: Partial<Record<EntityType, EditorEntityDefinition>>;
  stacking?: EditorStackingDefinition;
  palette: EditorPaletteDefinition;
  validators?: readonly EditorMapValidator[];
  deletion?: EditorDeletionDefinition;
}
