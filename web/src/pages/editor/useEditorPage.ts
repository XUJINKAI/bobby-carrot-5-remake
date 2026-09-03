import {
  EditorDocument,
  EditorPreview,
  applyEditorVariant,
  buildInspectorModel,
  builtinEditorDefinition,
  copySelection,
  createBuiltinEntityCatalog,
  cycleEntityVariant,
  cyclePlacementVariant,
  defaultSurfaceBrush,
  fillSurface,
  inspectEditorRules,
  paintSurface,
  pasteClipboard,
  pickSurfaceBrush,
  placeEntity,
  rectangleCells,
  removeEntities,
  reorderEntityStack,
  replaceEntities,
  replaceEntity,
  resolveDeletionTarget,
  resolveEditorPalette,
  resizeMapEdges,
  selectedEntityRefs,
  selectionCells,
  selectionRect,
  surfaceGroup,
  toLevelMap,
  updateEditorRule,
  updateMaxMoves,
  updateMaxTimeSeconds,
  updateMetadata,
  type Cell,
  type EditorClipboard,
  type EditorMap,
  type EditorPlacementPreset,
  type EditorResizeEdges,
  type EditorRuleKind,
  type EditorSelection,
  type EditorSnapshot,
  type EditorTool,
  type EntityFieldDefinition,
  type EntityRef,
  type PaletteItem,
  type SurfaceBrush,
  type SurfacePattern,
  type SurfaceTheme,
  type SurfaceTool,
  type SurfaceType,
} from "@bobby/editor";
import {
  type EntityProperties,
  type EntityState,
  type EntityType,
  type JsonValue,
  type LevelEntity,
} from "@bobby/model";
import { computed, onUnmounted, ref, shallowRef } from "vue";
import { storeEditorDraft } from "../../storage/editorDraftStorage.js";

export type EditorLeftPanel = "palette" | "surface";

export function useEditorPage(initialLevel: EditorMap) {
  const catalog = createBuiltinEntityCatalog();
  const editor = builtinEditorDefinition;
  const palette = resolveEditorPalette(catalog, editor);
  const first = palette.flatMap((group) => group.rows.flat())[0];
  if (!first) throw new Error("Editor Palette 不能为空");

  const document = new EditorDocument(initialLevel);
  const snapshot = shallowRef<EditorSnapshot>(document.getSnapshot());
  const tool = ref<EditorTool>("select");
  const placement = ref<PaletteItem>(first);
  const leftPanel = ref<EditorLeftPanel>("surface");
  const surfaceTool = ref<SurfaceTool>("brush");
  const surfaceBrush = ref<SurfaceBrush>(defaultSurfaceBrush());
  const mapSelection = ref<EditorSelection | null>(null);
  const clipboard = ref<EditorClipboard | null>(null);
  const hover = ref<Cell | null>(null);
  const playing = ref(false);
  const fileDialogOpen = ref(false);
  const helpDialogOpen = ref(false);
  const paletteSize = ref(readPaletteSize());
  let transactionActive = false;
  let surfaceRectAnchor: Cell | null = null;
  const unsubscribe = document.subscribe((next) => {
    snapshot.value = next;
    storeEditorDraft(next.level as EditorMap);
  });
  onUnmounted(unsubscribe);

  const currentLevel = (): EditorMap => snapshot.value.level as EditorMap;
  const preview = (): EditorPreview => new EditorPreview(currentLevel(), catalog);
  const selectedRefs = computed(() =>
    mapSelection.value
      ? selectedEntityRefs(currentLevel(), preview(), mapSelection.value)
      : [],
  );
  const inspector = computed(() =>
    buildInspectorModel(
      currentLevel(),
      catalog,
      mapSelection.value,
      editor,
    ),
  );
  const rules = computed(() => inspectEditorRules(currentLevel(), catalog));

  function setTool(next: EditorTool): void {
    leftPanel.value = "palette";
    tool.value = next;
  }

  function selectPalette(item: PaletteItem): void {
    leftPanel.value = "palette";
    placement.value = item;
    tool.value = "place";
  }

  function activateSurface(): void {
    leftPanel.value = "surface";
    tool.value = surfaceTool.value === "selection" ? "select" : "place";
  }

  function setSurfaceTool(next: SurfaceTool): void {
    activateSurface();
    surfaceTool.value = next;
    tool.value = next === "selection" ? "select" : "place";
  }

  function setSurfaceType(type: SurfaceType): void {
    activateSurface();
    const direct = surfaceGroup(type, surfaceBrush.value.theme);
    const fallback = direct ?? surfaceGroup(type, "shared") ?? undefined;
    if (!fallback) return;
    surfaceBrush.value = normalizeSurfaceBrush({
      ...surfaceBrush.value,
      type,
      theme: fallback.theme,
    });
  }

  function setSurfaceTheme(theme: SurfaceTheme): void {
    activateSurface();
    if (!surfaceGroup(surfaceBrush.value.type, theme)) return;
    surfaceBrush.value = normalizeSurfaceBrush({ ...surfaceBrush.value, theme });
  }

  function setSurfacePattern(pattern: SurfacePattern): void {
    activateSurface();
    surfaceBrush.value = normalizeSurfaceBrush({ ...surfaceBrush.value, pattern });
  }

  function setSurfaceExact(type: EntityType): void {
    activateSurface();
    surfaceBrush.value = normalizeSurfaceBrush({
      ...surfaceBrush.value,
      pattern: "exact",
      exact: type,
    });
  }

  function setSurfaceAlternate(index: 0 | 1, type: EntityType): void {
    activateSurface();
    const group = surfaceGroup(surfaceBrush.value.type, surfaceBrush.value.theme);
    if (!group?.variants.some((variant) => variant.type === type)) return;
    const first = surfaceBrush.value.alternate?.[0] ?? group.variants[0]?.type;
    const second = surfaceBrush.value.alternate?.[1] ?? group.variants[1]?.type ?? first;
    if (!first || !second) return;
    const alternate: [EntityType, EntityType] = [first, second];
    alternate[index] = type;
    surfaceBrush.value = {
      ...surfaceBrush.value,
      pattern: "alternate",
      alternate,
    };
  }

  function rerollSurface(): void {
    activateSurface();
    surfaceBrush.value = {
      ...surfaceBrush.value,
      pattern: "auto",
      seed: surfaceBrush.value.seed + 1,
    };
    if (mapSelection.value) applySurfaceSelection();
  }

  function applySurfaceSelection(): boolean {
    const selection = mapSelection.value;
    if (!selection) return false;
    return document.execute(
      paintSurface(catalog, selectionCells(selection), surfaceBrush.value),
    );
  }

  function primaryStart(cell: Cell): void {
    if (leftPanel.value === "surface") {
      surfacePrimaryStart(cell);
      return;
    }
    if (tool.value === "select") {
      mapSelection.value = { anchor: cell, focus: cell };
      return;
    }
    document.beginTransaction();
    transactionActive = true;
    applyPalettePrimary(cell);
  }

  function primaryMove(cell: Cell): void {
    if (leftPanel.value === "surface") {
      surfacePrimaryMove(cell);
      return;
    }
    if (tool.value === "select") {
      if (mapSelection.value)
        mapSelection.value = { ...mapSelection.value, focus: cell };
      return;
    }
    if (transactionActive) applyPalettePrimary(cell);
  }

  function primaryEnd(cell?: Cell | null): void {
    if (leftPanel.value === "surface") {
      surfacePrimaryEnd(cell ?? undefined);
      return;
    }
    if (!transactionActive) return;
    transactionActive = false;
    document.commitTransaction();
  }

  function surfacePrimaryStart(cell: Cell): void {
    if (surfaceTool.value === "fill") {
      document.execute(fillSurface(catalog, currentLevel(), cell, surfaceBrush.value));
      return;
    }
    if (surfaceTool.value === "selection") {
      mapSelection.value = { anchor: cell, focus: cell };
      return;
    }
    if (surfaceTool.value === "rect") {
      surfaceRectAnchor = cell;
      mapSelection.value = { anchor: cell, focus: cell };
      return;
    }
    document.beginTransaction();
    transactionActive = true;
    document.execute(paintSurface(catalog, [cell], surfaceBrush.value));
  }

  function surfacePrimaryMove(cell: Cell): void {
    if (surfaceTool.value === "selection" || surfaceTool.value === "rect") {
      if (mapSelection.value) mapSelection.value = { ...mapSelection.value, focus: cell };
      return;
    }
    if (surfaceTool.value === "brush" && transactionActive) {
      document.execute(paintSurface(catalog, [cell], surfaceBrush.value));
    }
  }

  function surfacePrimaryEnd(cell?: Cell): void {
    if (surfaceTool.value === "rect" && surfaceRectAnchor) {
      const focus = cell ?? mapSelection.value?.focus ?? surfaceRectAnchor;
      document.execute(
        paintSurface(
          catalog,
          rectangleCells(surfaceRectAnchor, focus),
          surfaceBrush.value,
        ),
      );
      surfaceRectAnchor = null;
      return;
    }
    if (!transactionActive) return;
    transactionActive = false;
    document.commitTransaction();
  }

  function applyPalettePrimary(cell: Cell): void {
    if (tool.value === "place") {
      document.execute(
        placeEntity(catalog, placement.value, cell, {}, editor),
      );
      return;
    }
    if (tool.value === "erase") {
      const ref = resolveDeletionTarget(
        currentLevel(),
        catalog,
        cell,
        editor,
      );
      if (ref) document.execute(removeEntities([ref]));
    }
  }

  function pickSurface(cell: Cell): boolean {
    const picked = pickSurfaceBrush(currentLevel(), cell);
    if (!picked) return false;
    surfaceBrush.value = picked;
    activateSurface();
    return true;
  }

  function ensureSelectionAt(cell: Cell): void {
    const selection = mapSelection.value;
    if (selection) {
      const rect = selectionRect(selection);
      if (
        cell.x >= rect.left &&
        cell.x <= rect.right &&
        cell.y >= rect.top &&
        cell.y <= rect.bottom
      )
        return;
    }
    mapSelection.value = { anchor: cell, focus: cell };
  }

  function copy(): boolean {
    if (!mapSelection.value) return false;
    clipboard.value = copySelection(
      currentLevel(),
      catalog,
      mapSelection.value,
    );
    return clipboard.value.entities.length > 0;
  }

  function cut(): boolean {
    if (!copy()) return false;
    return deleteSelection();
  }

  function deleteSelection(): boolean {
    const refs = selectedRefs.value;
    if (refs.length === 0) return false;
    const changed = document.execute(removeEntities(refs));
    if (changed) mapSelection.value = null;
    return changed;
  }

  function deleteLayer(entityIndex: number): boolean {
    return document.execute(removeEntities([{ index: entityIndex }]));
  }

  function deleteSelectedType(type: EntityType): boolean {
    const refs = selectedRefsOfType(type);
    return refs.length > 0 && document.execute(removeEntities(refs));
  }

  function reorderLayers(refsTopToBottom: readonly number[]): boolean {
    return document.execute(
      reorderEntityStack(refsTopToBottom.map((index) => ({ index }))),
    );
  }

  function paste(origin: Cell): boolean {
    const source = clipboard.value;
    if (!source || source.entities.length === 0) return false;
    const changed = document.execute({
      apply(level) {
        return pasteClipboard(level, source, origin);
      },
    });
    if (changed) {
      mapSelection.value = {
        anchor: origin,
        focus: {
          x: origin.x + source.width - 1,
          y: origin.y + source.height - 1,
        },
      };
    }
    return changed;
  }

  function applyVariant(entityIndex: number, index: number): boolean {
    const entity = currentLevel().entities[entityIndex];
    if (!entity) return false;
    const variant = editor.entities?.[entity.type]?.variants?.[index];
    if (!variant) return false;
    return document.execute(
      replaceEntity(
        { index: entityIndex },
        applyEditorVariant(entity, variant),
      ),
    );
  }

  function applyBatchVariant(type: EntityType, index: number): boolean {
    const variant = editor.entities?.[type]?.variants?.[index];
    if (!variant) return false;
    const replacements = selectedRefsOfType(type)
      .map((ref) => {
        const entity = currentLevel().entities[ref.index];
        return entity
          ? { ref, entity: applyEditorVariant(entity, variant) }
          : null;
      })
      .filter(
        (replacement): replacement is { ref: EntityRef; entity: LevelEntity } =>
          replacement !== null,
      );
    return (
      replacements.length > 0 && document.execute(replaceEntities(replacements))
    );
  }

  function cycleVariant(step: number, cell?: Cell): boolean {
    if (leftPanel.value === "surface") return false;
    if (tool.value === "erase") return false;
    if (tool.value === "place") {
      const definition = editor.entities?.[placement.value.type];
      const next = cyclePlacementVariant(
        placement.value,
        catalog,
        definition,
        step,
      );
      if (!next) return false;
      placement.value = {
        ...placement.value,
        ...cleanPlacementPreset(next),
        previewPreset: cleanPlacementPreset(next),
      };
      return true;
    }
    const targetCell = cell ?? mapSelection.value?.focus;
    if (!targetCell) return false;
    if (cell) ensureSelectionAt(cell);
    const inspection = [...preview().inspectCell(targetCell.x, targetCell.y).presences]
      .reverse()
      .find(
        (candidate) =>
          (editor.entities?.[candidate.entity.type]?.variants?.length ?? 0) > 0,
      );
    if (!inspection) return false;
    const next = cycleEntityVariant(
      inspection.entity,
      catalog,
      editor.entities?.[inspection.entity.type],
      step,
    );
    if (!next) return false;
    return document.execute(replaceEntity(inspection.ref, next));
  }

  function updateProperty(
    entityIndex: number,
    key: string,
    raw: string,
  ): void {
    updatePropertiesForRefs([{ index: entityIndex }], key, raw);
  }

  function updateBatchProperty(type: EntityType, key: string, raw: string): void {
    updatePropertiesForRefs(selectedRefsOfType(type), key, raw);
  }

  function updateState(entityIndex: number, key: string, raw: string): void {
    updateStateForRefs([{ index: entityIndex }], key, raw);
  }

  function updateBatchState(type: EntityType, key: string, raw: string): void {
    updateStateForRefs(selectedRefsOfType(type), key, raw);
  }

  function updatePropertiesForRefs(
    refs: readonly EntityRef[],
    key: string,
    raw: string,
  ): void {
    const replacements = refs.flatMap((ref) => {
      const entity = currentLevel().entities[ref.index];
      if (!entity) return [];
      const field = catalog
        .require(entity.type)
        .properties?.find((item) => item.key === key);
      if (!field) return [];
      const properties = { ...(entity.properties ?? {}) } as EntityProperties;
      if (raw === "") delete properties[key];
      else properties[key] = coerceFieldValue(field, raw);
      const next = { ...entity };
      if (Object.keys(properties).length > 0) next.properties = properties;
      else delete next.properties;
      return [{ ref, entity: next }];
    });
    if (replacements.length > 0) document.execute(replaceEntities(replacements));
  }

  function updateStateForRefs(
    refs: readonly EntityRef[],
    key: string,
    raw: string,
  ): void {
    const replacements = refs.flatMap((ref) => {
      const entity = currentLevel().entities[ref.index];
      if (!entity) return [];
      const field = catalog
        .require(entity.type)
        .state?.find((item) => item.key === key);
      if (!field) return [];
      const state = { ...(entity.state ?? {}) } as EntityState;
      if (raw === "") delete state[key];
      else state[key] = coerceFieldValue(field, raw);
      const next = { ...entity };
      if (Object.keys(state).length > 0) next.state = state;
      else delete next.state;
      return [{ ref, entity: next }];
    });
    if (replacements.length > 0) document.execute(replaceEntities(replacements));
  }

  function selectedRefsOfType(type: EntityType): EntityRef[] {
    const level = currentLevel();
    return selectedRefs.value.filter(
      (ref) => level.entities[ref.index]?.type === type,
    );
  }

  function resize(edges: EditorResizeEdges): void {
    const changed = document.execute(resizeMapEdges(catalog, edges));
    if (!changed || !mapSelection.value) return;
    const map = currentLevel();
    mapSelection.value = {
      anchor: shiftedCell(mapSelection.value.anchor, edges, map),
      focus: shiftedCell(mapSelection.value.focus, edges, map),
    };
  }

  function setRule(kind: EditorRuleKind, enabled: boolean): void {
    document.execute(updateEditorRule(catalog, kind, enabled));
  }

  function setPaletteSize(delta: number): void {
    const sizes = [32, 40, 48, 56, 64];
    const index = Math.max(0, sizes.indexOf(paletteSize.value));
    paletteSize.value =
      sizes[Math.min(sizes.length - 1, Math.max(0, index + delta))]!;
    localStorage.setItem(
      "bobby.editor.paletteSize",
      String(paletteSize.value),
    );
  }

  return {
    catalog,
    editor,
    palette,
    document,
    snapshot,
    tool,
    placement,
    leftPanel,
    surfaceTool,
    surfaceBrush,
    mapSelection,
    clipboard,
    hover,
    playing,
    fileDialogOpen,
    helpDialogOpen,
    paletteSize,
    inspector,
    selectedRefs,
    rules,
    levelMap: computed(() => toLevelMap(currentLevel())),
    setTool,
    selectPalette,
    activateSurface,
    setSurfaceTool,
    setSurfaceType,
    setSurfaceTheme,
    setSurfacePattern,
    setSurfaceExact,
    setSurfaceAlternate,
    rerollSurface,
    applySurfaceSelection,
    pickSurface,
    primaryStart,
    primaryMove,
    primaryEnd,
    ensureSelectionAt,
    copy,
    cut,
    paste,
    deleteSelection,
    deleteLayer,
    deleteSelectedType,
    reorderLayers,
    applyVariant,
    applyBatchVariant,
    cycleVariant,
    transform: (cell: Cell, step: number) => cycleVariant(step, cell),
    updateProperty,
    updateBatchProperty,
    updateState,
    updateBatchState,
    setPaletteSize,
    resize,
    setRule,
    setMaxMoves(value: number | null): void {
      document.execute(updateMaxMoves(value));
    },
    setMaxTimeSeconds(value: number | null): void {
      document.execute(updateMaxTimeSeconds(value));
    },
    updateMetadata(metadata: {
      name: string;
      author?: string;
      description?: string;
    }): void {
      document.execute(updateMetadata(metadata));
    },
  };
}

function normalizeSurfaceBrush(brush: SurfaceBrush): SurfaceBrush {
  const group = surfaceGroup(brush.type, brush.theme);
  const first = group?.variants[0]?.type;
  const second = group?.variants[1]?.type ?? first;
  if (!first) return brush;
  const exact =
    brush.exact && group.variants.some((variant) => variant.type === brush.exact)
      ? brush.exact
      : first;
  return {
    ...brush,
    exact,
    alternate: [
      group.variants.some((variant) => variant.type === brush.alternate?.[0])
        ? brush.alternate![0]
        : first,
      group.variants.some((variant) => variant.type === brush.alternate?.[1])
        ? brush.alternate![1]
        : second!,
    ],
  };
}

function cleanPlacementPreset(source: EditorPlacementPreset): EditorPlacementPreset {
  return {
    type: source.type,
    ...(source.direction ? { direction: source.direction } : {}),
    ...(source.properties
      ? { properties: structuredClone(source.properties) }
      : {}),
    ...(source.state ? { state: structuredClone(source.state) } : {}),
  };
}

function shiftedCell(
  cell: Cell,
  edges: EditorResizeEdges,
  map: EditorMap,
): Cell {
  return {
    x: Math.max(0, Math.min(map.width - 1, cell.x + edges.left)),
    y: Math.max(0, Math.min(map.height - 1, cell.y + edges.top)),
  };
}

function coerceFieldValue(
  field: EntityFieldDefinition,
  raw: string,
): JsonValue {
  if (field.kind === "number") {
    const value = Number(raw);
    return Number.isFinite(value) ? value : raw;
  }
  if (field.kind === "boolean") return raw === "true";
  if (field.kind === "enum") {
    const option = field.options?.find(
      (candidate) => String(candidate.value) === raw,
    );
    if (option) return structuredClone(option.value);
  }
  return raw;
}

function readPaletteSize(): number {
  const stored = Number(localStorage.getItem("bobby.editor.paletteSize"));
  return [32, 40, 48, 56, 64].includes(stored) ? stored : 48;
}
