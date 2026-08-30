import {
  EditorDocument,
  EditorPreview,
  applyEditorVariant,
  buildInspectorModel,
  builtinEditorDefinition,
  copySelection,
  createBuiltinEntityCatalog,
  placeEntity,
  removeEntities,
  replaceEntity,
  resolveDeletionTarget,
  resolveEditorPalette,
  resizeDocument,
  selectedEntityRefs,
  selectionRect,
  setEntityDirection,
  toLevelMap,
  updateEntityProperties,
  updateEntityState,
  updateMaxMoves,
  updateMaxTimeSeconds,
  updateMetadata,
  updateWinCondition,
  type Cell,
  type EditorClipboard,
  type EditorEntityVariant,
  type EditorLevel,
  type EditorSelection,
  type EditorSnapshot,
  type EditorTool,
  type EntityFieldDefinition,
  type PaletteItem,
} from "@bobby/editor";
import { EntityTypeId, type Direction, type EntityProperties, type EntityState, type JsonValue, type LevelEntity, type WinCondition } from "@bobby/model";
import { computed, onUnmounted, ref, shallowRef } from "vue";
import { storeEditorDraft } from "../../storage/editorDraftStorage.js";

export function useEditorPage(initialLevel: EditorLevel) {
  const catalog = createBuiltinEntityCatalog();
  const editor = builtinEditorDefinition;
  const palette = resolveEditorPalette(catalog, editor);
  const first = palette.flatMap((group) => group.rows.flat()).find((item) => item.type === EntityTypeId.GROUND_C)
    ?? palette.flatMap((group) => group.rows.flat())[0]
    ?? { type: EntityTypeId.GROUND_C, key: "fallback", label: "Ground" };
  const document = new EditorDocument(initialLevel);
  const snapshot = shallowRef<EditorSnapshot>(document.getSnapshot());
  const tool = ref<EditorTool>("place");
  const placement = ref<PaletteItem>(first);
  const mapSelection = ref<EditorSelection | null>(null);
  const clipboard = ref<EditorClipboard | null>(null);
  const hover = ref<Cell | null>(null);
  const playing = ref(false);
  const fileDialogOpen = ref(false);
  const helpDialogOpen = ref(false);
  const paletteSize = ref(readPaletteSize());
  let transactionActive = false;
  const unsubscribe = document.subscribe((next) => {
    snapshot.value = next;
    storeEditorDraft(next.level as EditorLevel);
  });
  onUnmounted(unsubscribe);

  const currentLevel = (): EditorLevel => snapshot.value.level as EditorLevel;
  const preview = (): EditorPreview => new EditorPreview(currentLevel(), catalog);
  const selectedRefs = computed(() => mapSelection.value
    ? selectedEntityRefs(currentLevel(), preview(), mapSelection.value)
    : []);
  const inspector = computed(() => buildInspectorModel(currentLevel(), catalog, mapSelection.value, editor));
  const selectedEntity = computed(() => {
    if (selectedRefs.value.length !== 1) return null;
    const ref = selectedRefs.value[0]!;
    const entity = currentLevel().entities[ref.index];
    return entity ? { ref, entity, definition: catalog.require(entity.type), editor: editor.entities?.[entity.type] } : null;
  });
  const variants = computed(() => selectedEntity.value?.editor?.variants ?? []);

  function setTool(next: EditorTool): void { tool.value = next; }
  function selectPalette(item: PaletteItem): void {
    placement.value = item;
    tool.value = "place";
  }
  function primaryStart(cell: Cell): void {
    if (tool.value === "select") {
      mapSelection.value = { anchor: cell, focus: cell };
      return;
    }
    document.beginTransaction();
    transactionActive = true;
    applyPrimary(cell);
  }
  function primaryMove(cell: Cell): void {
    if (tool.value === "select") {
      if (mapSelection.value) mapSelection.value = { ...mapSelection.value, focus: cell };
      return;
    }
    if (transactionActive) applyPrimary(cell);
  }
  function primaryEnd(): void {
    if (!transactionActive) return;
    transactionActive = false;
    document.commitTransaction();
  }
  function applyPrimary(cell: Cell): void {
    if (tool.value === "place") {
      document.execute(placeEntity(catalog, placement.value, cell, {}, editor));
      return;
    }
    if (tool.value === "erase") {
      const ref = resolveDeletionTarget(currentLevel(), catalog, cell, editor);
      if (ref) document.execute(removeEntities([ref]));
    }
  }
  function ensureSelectionAt(cell: Cell): void {
    const selection = mapSelection.value;
    if (selection) {
      const rect = selectionRect(selection);
      if (cell.x >= rect.left && cell.x <= rect.right && cell.y >= rect.top && cell.y <= rect.bottom) return;
    }
    mapSelection.value = { anchor: cell, focus: cell };
  }
  function copy(): boolean {
    if (!mapSelection.value) return false;
    clipboard.value = copySelection(currentLevel(), catalog, mapSelection.value);
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
  function paste(origin: Cell): boolean {
    const source = clipboard.value;
    if (!source || source.entities.length === 0) return false;
    const additions = source.entities.map((entity) => ({ ...structuredClone(entity), x: origin.x + entity.x, y: origin.y + entity.y }))
      .filter((entity) => entity.x >= 0 && entity.y >= 0 && entity.x < currentLevel().width && entity.y < currentLevel().height);
    if (additions.length === 0) return false;
    const command = { apply(level: EditorLevel): EditorLevel { return { ...level, entities: [...level.entities, ...additions] }; } };
    const changed = document.execute(command);
    if (changed) mapSelection.value = { anchor: origin, focus: { x: origin.x + source.width - 1, y: origin.y + source.height - 1 } };
    return changed;
  }
  function applyVariant(index: number): boolean {
    const selected = selectedEntity.value;
    const variant = variants.value[index];
    if (!selected || !variant) return false;
    return document.execute(replaceEntity(selected.ref, applyEditorVariant(selected.entity, variant)));
  }
  function setDirection(direction: Direction): boolean {
    const selected = selectedEntity.value;
    if (!selected) return false;
    return document.execute(setEntityDirection(selected.ref, direction));
  }
  function transform(cell: Cell, step: number): boolean {
    ensureSelectionAt(cell);
    const selected = selectedEntity.value;
    if (!selected) return false;
    const options = selected.editor?.variants ?? [];
    if (options.length === 0) return false;
    const current = options.findIndex((variant) => variantMatches(selected.entity, variant));
    const index = (Math.max(0, current) + step + options.length) % options.length;
    return document.execute(replaceEntity(selected.ref, applyEditorVariant(selected.entity, options[index]!)));
  }
  function updateProperty(entityIndex: number, key: string, raw: string): void {
    const entity = currentLevel().entities[entityIndex];
    if (!entity) return;
    const field = catalog.require(entity.type).properties?.find((item) => item.key === key);
    if (!field) return;
    const properties = { ...(entity.properties ?? {}) } as EntityProperties;
    if (raw === "") delete properties[key]; else properties[key] = coerceFieldValue(field, raw);
    document.execute(updateEntityProperties({ index: entityIndex }, Object.keys(properties).length ? properties : undefined));
  }
  function updateState(entityIndex: number, key: string, raw: string): void {
    const entity = currentLevel().entities[entityIndex];
    if (!entity) return;
    const field = catalog.require(entity.type).state?.find((item) => item.key === key);
    if (!field) return;
    const state = { ...(entity.state ?? {}) } as EntityState;
    if (raw === "") delete state[key]; else state[key] = coerceFieldValue(field, raw);
    document.execute(updateEntityState({ index: entityIndex }, Object.keys(state).length ? state : undefined));
  }
  function setPaletteSize(delta: number): void {
    const sizes = [32, 40, 48, 56, 64];
    const index = Math.max(0, sizes.indexOf(paletteSize.value));
    paletteSize.value = sizes[Math.min(sizes.length - 1, Math.max(0, index + delta))]!;
    localStorage.setItem("bobby.editor.paletteSize", String(paletteSize.value));
  }

  return {
    catalog, editor, palette, document, snapshot, tool, placement, mapSelection, clipboard, hover,
    playing, fileDialogOpen, helpDialogOpen, paletteSize, inspector, selectedRefs, selectedEntity, variants,
    levelMap: computed(() => toLevelMap(currentLevel())),
    setTool, selectPalette, primaryStart, primaryMove, primaryEnd, ensureSelectionAt,
    copy, cut, paste, deleteSelection, applyVariant, setDirection, transform,
    updateProperty, updateState, setPaletteSize,
    resize(width: number, height: number): void { document.execute(resizeDocument(width, height)); },
    setMaxMoves(value: number | null): void { document.execute(updateMaxMoves(value)); },
    setMaxTimeSeconds(value: number | null): void { document.execute(updateMaxTimeSeconds(value)); },
    setWin(value: WinCondition): void { document.execute(updateWinCondition(value)); },
    updateMetadata(metadata: { name: string; author?: string; description?: string }): void { document.execute(updateMetadata(metadata)); },
  };
}

function variantMatches(entity: Readonly<LevelEntity>, variant: EditorEntityVariant): boolean {
  if (variant.direction && entity.direction !== variant.direction) return false;
  for (const [key, value] of Object.entries(variant.properties ?? {}))
    if (JSON.stringify(entity.properties?.[key]) !== JSON.stringify(value)) return false;
  for (const [key, value] of Object.entries(variant.state ?? {}))
    if (JSON.stringify(entity.state?.[key]) !== JSON.stringify(value)) return false;
  return true;
}
function coerceFieldValue(field: EntityFieldDefinition, raw: string): JsonValue {
  if (field.kind === "number") { const value = Number(raw); return Number.isFinite(value) ? value : raw; }
  if (field.kind === "boolean") return raw === "true";
  if (field.kind === "enum") {
    const option = field.options?.find((candidate) => String(candidate.value) === raw);
    if (option) return structuredClone(option.value);
  }
  return raw;
}
function readPaletteSize(): number {
  const stored = Number(localStorage.getItem("bobby.editor.paletteSize"));
  return [32, 40, 48, 56, 64].includes(stored) ? stored : 48;
}
