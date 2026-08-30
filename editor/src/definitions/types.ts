import type {
  EntityCatalog,
  VisualDefinition,
} from "@bobby/engine/authoring";
import type {
  Direction,
  EntityProperties,
  EntityState,
  EntityType,
  LevelEntity,
} from "@bobby/model";
import type { Cell } from "../authoring/entityPlacement.js";
import type { EditorMap, EntityRef, LevelValidationIssue } from "../level/types.js";

/** Stable Editor interaction modes. Concrete Entity knowledge must not leak into this type. */
export type EditorTool = "select" | "place" | "erase";

/** What the Editor Core should create when the current placement action is committed. */
export interface EditorPlacementPreset {
  type: EntityType;
  direction?: Direction;
  properties?: EntityProperties;
  state?: EntityState;
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
  direction?: Direction;
  properties?: EntityProperties;
  state?: EntityState;
}

export interface EditorQuickAction {
  id: string;
  label: string;
  apply(entity: Readonly<LevelEntity>): LevelEntity;
}

/** Entity-specific authoring policy. This belongs to Editor, never Engine. */
export interface EditorEntityDefinition {
  creatable?: boolean;
  placementPoint?: EditorPlacementPoint;
  defaultDirection?: Direction;
  replaceGroup?: string;
  variants?: readonly EditorEntityVariant[];
  quickActions?: readonly EditorQuickAction[];
  editorVisual?: VisualDefinition["resolve"];
}

export interface EditorPalettePreview {
  direction?: Direction;
  properties?: EntityProperties;
  state?: EntityState;
}

export interface EditorPaletteEntry extends EditorPlacementPreset {
  label?: string;
  preview?: EditorPalettePreview;
}

export interface EditorPaletteGroup {
  id: string;
  label: string;
  rows: readonly (readonly EditorPaletteEntry[])[];
}

export interface EditorPaletteDefinition {
  groups: readonly EditorPaletteGroup[];
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
  entities?: Partial<Record<EntityType, EditorEntityDefinition>>;
  palette: EditorPaletteDefinition;
  validators?: readonly EditorMapValidator[];
  deletion?: EditorDeletionDefinition;
}
