import {
  EditorDocument,
  EditorPreview,
  applyEditorVariant,
  applyPlacementVariant as applyPlacementVariantPreset,
  applySurfaceTheme,
  buildInspectorModel,
  builtinEditorDefinition,
  copyEntitySelection,
  createBuiltinEntityCatalog,
  cycleEntityVariant,
  cyclePlacementVariant,
  defaultSurfaceBrush,
  detectSurfaceTheme,
  fillSurface,
  inspectEditorRules,
  isSurfaceEntityType,
  paintSurface,
  pasteClipboard,
  pickSurfaceBrush,
  placeEntity,
  rectangleCells,
  removeEntities,
  reorderEntityStack,
  replaceSurfaceVisualVariant,
  replaceEntities,
  replaceEntity,
  resolveDeletion,
  resolveDeletionTarget,
  resolveEditorPalette,
  resolvePalettePlacement,
  resizeMapEdges,
  selectedEntityRefs,
  selectionRect,
  surfaceTerrain,
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
  type EntityRef,
  type PaletteItem,
  type SurfaceBrush,
  type SurfacePattern,
  type SurfaceTerrainId,
  type SurfaceTheme,
  type SurfaceTool,
} from "@bobby/editor";
import {
  entityMapDefinition,
  type EntityMapFieldDefinition,
  type EntityType,
  type JsonPrimitive,
  type LevelEntity,
} from "@bobby/model";
import { computed, onUnmounted, ref, shallowRef } from "vue";
import {
  EDITOR_PALETTE_SIZES,
  type EditorPaletteSize,
} from "../../storage/contracts.js";
import { storeEditorAutosave } from "../../storage/editorDraftStorage.js";
import {
  getWebSettings,
  updateWebSettings,
} from "../../storage/settingsStorage.js";

export type EditorLeftPanel = "palette" | "surface";

export function useEditorPage(initialLevel: EditorMap) {
  const catalog = createBuiltinEntityCatalog();
  const editor = builtinEditorDefinition;
  const palette = resolveEditorPalette(catalog, editor);
  const first = palette.flatMap((group) => group.rows.flat())[0];
  if (!first) throw new Error("Editor Palette 不能为空");

  const document = new EditorDocument(initialLevel);
  const snapshot = shallowRef<EditorSnapshot>(document.getSnapshot());
  const paletteTool = ref<EditorTool>("select");
  const placement = ref<PaletteItem>(first);
  const leftPanel = ref<EditorLeftPanel>("palette");
  const surfaceTool = ref<SurfaceTool>("rect");
  const surfaceBrush = ref<SurfaceBrush>(defaultSurfaceBrush());
  const mapSelection = ref<EditorSelection | null>(null);
  const clipboard = ref<EditorClipboard | null>(null);
  const hover = ref<Cell | null>(null);
  const playing = ref(false);
  const fileDialogOpen = ref(false);
  const helpDialogOpen = ref(false);
  const paletteSize = ref(readPaletteSize());
  let transactionActive = false;
  const eraseVisited = new Set<string>();

  const unsubscribe = document.subscribe((next) => {
    snapshot.value = next;
    storeEditorAutosave(next.level as EditorMap);
  });
  onUnmounted(unsubscribe);

  const currentLevel = (): EditorMap => snapshot.value.level as EditorMap;
  const preview = (): EditorPreview => new EditorPreview(currentLevel(), catalog);
  const tool = computed<EditorTool>(() =>
    leftPanel.value === "surface"
      ? surfaceTool.value === "rect"
        ? "select"
        : "place"
      : paletteTool.value,
  );
  const selectedRefs = computed(() =>
    mapSelection.value
      ? selectedEntityRefs(currentLevel(), preview(), mapSelection.value)
      : [],
  );
  const inspector = computed(() =>
    buildInspectorModel(currentLevel(), catalog, mapSelection.value, editor),
  );
  const hoverInspector = computed(() => {
    if (
      leftPanel.value !== "palette" ||
      paletteTool.value !== "erase"
    )
      return buildInspectorModel(currentLevel(), catalog, null, editor);
    const cell = hover.value;
    if (!cell)
      return buildInspectorModel(currentLevel(), catalog, null, editor);
    return buildInspectorModel(
      currentLevel(),
      catalog,
      { anchor: cell, focus: cell },
      editor,
    );
  });
  const deletionTargetIndex = computed(() => {
    if (
      leftPanel.value !== "palette" ||
      paletteTool.value !== "erase"
    )
      return null;
    const cell = hover.value;
    if (!cell) return null;
    return resolveDeletionTarget(currentLevel(), catalog, cell, editor)?.index ?? null;
  });
  const rules = computed(() => inspectEditorRules(currentLevel(), catalog));
  const surfaceTheme = computed(() => detectSurfaceTheme(currentLevel()));

  function setTool(next: EditorTool): void {
    leftPanel.value = "palette";
    paletteTool.value = next;
  }

  function selectPalette(item: PaletteItem): void {
    leftPanel.value = "palette";
    placement.value = item;
    paletteTool.value = "place";
  }

  function activatePalette(): void {
    leftPanel.value = "palette";
  }

  function activateSurface(): void {
    leftPanel.value = "surface";
  }

  function toggleAuthoringPanel(): EditorLeftPanel {
    leftPanel.value = leftPanel.value === "palette" ? "surface" : "palette";
    return leftPanel.value;
  }

  function setSurfaceTool(next: SurfaceTool): void {
    activateSurface();
    surfaceTool.value = next;
  }

  function selectSurfaceTerrain(terrainId: SurfaceTerrainId): void {
    activateSurface();
    surfaceBrush.value = normalizeSurfaceBrush({
      ...surfaceBrush.value,
      terrain: terrainId,
    });
  }

  function setSurfaceTheme(theme: SurfaceTheme): boolean {
    activateSurface();
    return document.execute(applySurfaceTheme(catalog, theme));
  }

  function setSurfacePattern(pattern: SurfacePattern): void {
    activateSurface();
    surfaceBrush.value = normalizeSurfaceBrush({
      ...surfaceBrush.value,
      pattern,
    });
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
    const variants = surfaceTerrain(surfaceBrush.value.terrain).rows.flat();
    if (!variants.some((variant) => variant.type === type)) return;
    const first = surfaceBrush.value.alternate?.[0] ?? variants[0]?.type;
    const second =
      surfaceBrush.value.alternate?.[1] ?? variants[1]?.type ?? first;
    if (!first || !second) return;
    const alternate: [EntityType, EntityType] = [first, second];
    alternate[index] = type;
    surfaceBrush.value = {
      ...surfaceBrush.value,
      pattern: "alternate",
      alternate,
    };
  }

  function primaryStart(cell: Cell): void {
    if (fillSelectionWithBrush(cell)) return;
    if (leftPanel.value === "surface") {
      surfacePrimaryStart(cell);
      return;
    }
    if (paletteTool.value === "select") {
      mapSelection.value = { anchor: cell, focus: cell };
      return;
    }
    if (paletteTool.value === "erase") {
      document.beginTransaction();
      transactionActive = true;
      eraseVisited.clear();
      applyErase(cell);
      return;
    }
    if (paletteTool.value !== "place") return;
    document.beginTransaction();
    transactionActive = true;
    applyPaletteBrush(cell);
  }

  function primaryMove(cell: Cell): void {
    if (leftPanel.value === "surface") {
      surfacePrimaryMove(cell);
      return;
    }
    if (paletteTool.value === "select") {
      if (mapSelection.value)
        mapSelection.value = { ...mapSelection.value, focus: cell };
      return;
    }
    if (paletteTool.value === "place" && transactionActive) {
      applyPaletteBrush(cell);
      return;
    }
    if (paletteTool.value === "erase" && transactionActive) applyErase(cell);
  }

  function primaryEnd(): void {
    if (isSelectMode()) return;
    if (!transactionActive) return;
    transactionActive = false;
    eraseVisited.clear();
    document.commitTransaction();
  }

  function surfacePrimaryStart(cell: Cell): void {
    if (surfaceTool.value === "fill") {
      document.execute(fillSurface(catalog, currentLevel(), cell, surfaceBrush.value));
      return;
    }
    if (surfaceTool.value === "rect") {
      mapSelection.value = { anchor: cell, focus: cell };
      return;
    }
    document.beginTransaction();
    transactionActive = true;
    document.execute(paintSurface(catalog, [cell], surfaceBrush.value));
  }

  function surfacePrimaryMove(cell: Cell): void {
    if (surfaceTool.value === "rect") {
      if (mapSelection.value)
        mapSelection.value = { ...mapSelection.value, focus: cell };
      return;
    }
    if (surfaceTool.value === "brush" && transactionActive)
      document.execute(paintSurface(catalog, [cell], surfaceBrush.value));
  }

  function fillSelectionWithBrush(cell: Cell): boolean {
    const selection = mapSelection.value;
    if (!selection || !selectionContains(selection, cell)) return false;
    const cells = rectangleCells(selection.anchor, selection.focus);
    if (
      leftPanel.value === "surface" &&
      surfaceTool.value === "brush"
    ) {
      document.execute(paintSurface(catalog, cells, surfaceBrush.value));
      return true;
    }
    if (
      leftPanel.value === "palette" &&
      paletteTool.value === "place"
    ) {
      document.beginTransaction();
      for (const target of cells) applyPaletteBrush(target);
      document.commitTransaction();
      return true;
    }
    return false;
  }

  function selectionContains(selection: EditorSelection, cell: Cell): boolean {
    const rect = selectionRect(selection);
    return (
      cell.x >= rect.left &&
      cell.x <= rect.right &&
      cell.y >= rect.top &&
      cell.y <= rect.bottom
    );
  }

  function isSelectMode(): boolean {
    return leftPanel.value === "surface"
      ? surfaceTool.value === "rect"
      : paletteTool.value === "select";
  }

  function applyPaletteBrush(cell: Cell): void {
    document.execute(placeEntity(catalog, placement.value, cell, {}, editor));
  }

  function applyErase(cell: Cell): void {
    const key = `${cell.x},${cell.y}`;
    if (eraseVisited.has(key)) return;
    eraseVisited.add(key);
    const refs = resolveDeletion(
      currentLevel(),
      catalog,
      { anchor: cell, focus: cell },
      editor,
    );
    if (refs.length > 0) document.execute(removeEntities(refs));
  }

  function pickSurface(cell: Cell): boolean {
    const picked = pickSurfaceBrush(currentLevel(), cell);
    if (!picked) return false;
    surfaceBrush.value = normalizeSurfaceBrush(picked);
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

  function entitySelectedRefs(): EntityRef[] {
    const level = currentLevel();
    return selectedRefs.value.filter((ref) => {
      const entity = level.entities[ref.index];
      return Boolean(entity && !isSurfaceEntityType(entity.type));
    });
  }

  function copy(): boolean {
    if (!mapSelection.value) return false;
    clipboard.value = copyEntitySelection(
      currentLevel(),
      catalog,
      mapSelection.value,
    );
    return clipboard.value.entities.length > 0;
  }

  function cut(): boolean {
    if (!copy()) return false;
    const refs = entitySelectedRefs();
    return refs.length > 0 && document.execute(removeEntities(refs));
  }

  function deleteSelection(): boolean {
    if (leftPanel.value === "surface" || !mapSelection.value) return false;
    const refs = resolveDeletion(
      currentLevel(),
      catalog,
      mapSelection.value,
      editor,
    );
    return refs.length > 0 && document.execute(removeEntities(refs));
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
      replaceEntity({ index: entityIndex }, applyEditorVariant(entity, variant)),
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

  function applySurfaceVariant(
    entityIndex: number,
    variantType: EntityType,
  ): boolean {
    const entity = currentLevel().entities[entityIndex];
    if (!entity) return false;
    const replacement = replaceSurfaceVisualVariant(entity, variantType);
    return Boolean(
      replacement &&
      document.execute(replaceEntity({ index: entityIndex }, replacement)),
    );
  }

  function applyBatchSurfaceVariant(
    type: EntityType,
    variantType: EntityType,
  ): boolean {
    const replacements = selectedRefsOfType(type)
      .map((ref) => {
        const entity = currentLevel().entities[ref.index];
        const replacement = entity
          ? replaceSurfaceVisualVariant(entity, variantType)
          : null;
        return replacement ? { ref, entity: replacement } : null;
      })
      .filter(
        (replacement): replacement is { ref: EntityRef; entity: LevelEntity } =>
          replacement !== null,
      );
    return (
      replacements.length > 0 && document.execute(replaceEntities(replacements))
    );
  }

  function cycleVariant(step: number): boolean {
    if (leftPanel.value === "surface") return false;
    if (paletteTool.value !== "place") {
      const targetCell = mapSelection.value?.focus;
      if (!targetCell) return false;
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
    const definition = editor.entities?.[placement.value.type];
    const next = cyclePlacementVariant(
      placement.value,
      catalog,
      definition,
      step,
    );
    if (!next) return false;
    setPlacementPreset(cleanPlacementPreset(next));
    return true;
  }

  function applyPlacementVariant(index: number): boolean {
    const current = placement.value;
    const variant = editor.entities?.[current.type]?.variants?.[index];
    if (!variant) return false;
    setPlacementPreset(applyPlacementVariantPreset(current, variant));
    return true;
  }

  function setPlacementPreset(preset: EditorPlacementPreset): void {
    placement.value = resolvePalettePlacement(
      catalog,
      editor,
      palette,
      preset,
      placement.value.label,
    );
  }

  function updateField(entityIndex: number, key: string, raw: string): void {
    updateFieldsForRefs([{ index: entityIndex }], key, raw);
  }

  function updateBatchField(type: EntityType, key: string, raw: string): void {
    updateFieldsForRefs(selectedRefsOfType(type), key, raw);
  }

  function updateFieldsForRefs(
    refs: readonly EntityRef[],
    key: string,
    raw: string,
  ): void {
    const replacements = refs.flatMap((ref) => {
      const entity = currentLevel().entities[ref.index];
      if (!entity) return [];
      const field = entityMapDefinition(entity.type)?.fields.find(
        (candidate) => candidate.key === key,
      );
      if (!field) return [];
      const next: LevelEntity = { ...entity };
      if (raw === "") delete next[key];
      else next[key] = coerceFieldValue(field, raw);
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
    const index = Math.max(0, EDITOR_PALETTE_SIZES.indexOf(paletteSize.value));
    paletteSize.value =
      EDITOR_PALETTE_SIZES[
        Math.min(
          EDITOR_PALETTE_SIZES.length - 1,
          Math.max(0, index + delta),
        )
      ]!;
    updateWebSettings((settings) => ({
      ...settings,
      editor: { ...settings.editor, paletteSize: paletteSize.value },
    }));
  }

  return {
    catalog,
    editor,
    palette,
    document,
    snapshot,
    tool,
    paletteTool,
    placement,
    leftPanel,
    surfaceTool,
    surfaceBrush,
    surfaceTheme,
    mapSelection,
    clipboard,
    hover,
    playing,
    fileDialogOpen,
    helpDialogOpen,
    paletteSize,
    inspector,
    hoverInspector,
    deletionTargetIndex,
    selectedRefs,
    rules,
    levelMap: computed(() => toLevelMap(currentLevel())),
    setTool,
    selectPalette,
    activatePalette,
    activateSurface,
    toggleAuthoringPanel,
    setSurfaceTool,
    selectSurfaceTerrain,
    setSurfaceTheme,
    setSurfacePattern,
    setSurfaceExact,
    setSurfaceAlternate,
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
    applySurfaceVariant,
    applyBatchSurfaceVariant,
    cycleVariant,
    applyPlacementVariant,
    updateField,
    updateBatchField,
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
      note?: string;
    }): void {
      document.execute(updateMetadata(metadata));
    },
  };
}

function normalizeSurfaceBrush(brush: SurfaceBrush): SurfaceBrush {
  const variants = surfaceTerrain(brush.terrain).rows.flat();
  const first = variants[0]?.type;
  const second = variants[1]?.type ?? first;
  if (!first) return brush;
  const exact =
    brush.exact && variants.some((variant) => variant.type === brush.exact)
      ? brush.exact
      : first;
  return {
    ...brush,
    exact,
    alternate: [
      variants.some((variant) => variant.type === brush.alternate?.[0])
        ? brush.alternate![0]
        : first,
      variants.some((variant) => variant.type === brush.alternate?.[1])
        ? brush.alternate![1]
        : second!,
    ],
  };
}

function cleanPlacementPreset(source: EditorPlacementPreset): EditorPlacementPreset {
  return {
    type: source.type,
    ...(source.fields ? { fields: structuredClone(source.fields) } : {}),
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
  field: EntityMapFieldDefinition,
  raw: string,
): JsonPrimitive {
  if (field.kind === "number" || field.kind === "integer") {
    const value = Number(raw);
    return Number.isFinite(value)
      ? field.kind === "integer"
        ? Math.trunc(value)
        : value
      : raw;
  }
  if (field.kind === "boolean") return raw === "true";
  if (field.kind === "enum") {
    const option = field.values.find((candidate) => String(candidate) === raw);
    if (option !== undefined) return option;
  }
  return raw;
}

function readPaletteSize(): EditorPaletteSize {
  return getWebSettings().editor.paletteSize;
}
