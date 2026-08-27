import {
  EditorDocument,
  EditorPreview,
  buildInspectorModel,
  placeEntity,
  removeEntity,
  resizeDocument,
  setEntityDirection,
  toLevelMap,
  topEntityRefAt,
  updateEntityProperties,
  updateEntityState,
  updateMetadata,
  updateMaxMoves,
  type Cell,
  type EditorLevel,
  type EditorSnapshot,
  type PaletteItem,
} from "@bobby/editor";
import {
  createBuiltinEntityRegistry,
  type EntityFieldDefinition,
} from "@bobby/engine";
import {
  EntityTypeId,
  type Direction,
  type EntityProperties,
  type EntityState,
  type JsonValue,
} from "@bobby/model";
import { computed, onUnmounted, ref, shallowRef } from "vue";

const DIRECTIONS: Direction[] = ["up", "right", "down", "left"];

export function useEditorPage(initialLevel: EditorLevel) {
  const registry = createBuiltinEntityRegistry();
  const document = new EditorDocument(initialLevel);
  const snapshot = shallowRef<EditorSnapshot>(document.getSnapshot());
  const selection = ref<PaletteItem>({ type: EntityTypeId.GROUND_C });
  const hover = ref<Cell | null>(null);
  const playing = ref(false);
  const fileDialogOpen = ref(false);
  const helpDialogOpen = ref(false);
  const paletteSize = ref(readPaletteSize());
  const unsubscribe = document.subscribe((next) => {
    snapshot.value = next;
  });
  onUnmounted(unsubscribe);

  const currentLevel = (): EditorLevel => snapshot.value.level as EditorLevel;
  const preview = (): EditorPreview => new EditorPreview(currentLevel(), registry);
  const inspector = computed(() =>
    buildInspectorModel(
      currentLevel(),
      registry,
      hover.value,
      selection.value,
    ),
  );

  function stroke(cell: Cell, button: 0 | 2): void {
    if (button === 2) {
      const ref = topEntityRefAt(preview(), cell);
      if (ref) document.execute(removeEntity(ref));
      return;
    }
    document.executePlacement((placementSequence) =>
      placeEntity(registry, selection.value.type, cell, {}, { placementSequence }),
    );
  }

  function transform(cell: Cell, step: number): boolean {
    const inspected = preview().inspectCell(cell.x, cell.y).top;
    if (!inspected) return false;
    const definition = inspected.definition;
    const entity = inspected.entity;
    if (
      definition.footprint?.rotateWithDirection ||
      definition.authoring?.defaultDirection ||
      entity.direction
    ) {
      const current = entity.direction ?? definition.authoring?.defaultDirection ?? "right";
      const index = DIRECTIONS.indexOf(current);
      const next = DIRECTIONS[(index + step + DIRECTIONS.length) % DIRECTIONS.length]!;
      return document.execute(setEntityDirection(inspected.ref, next));
    }
    const variant = definition.state?.find(
      (field) => field.kind === "enum" && (field.options?.length ?? 0) > 1,
    );
    if (!variant?.options?.length) return false;
    const state = { ...(entity.state ?? {}) } as EntityState;
    const current = state[variant.key] ?? variant.default ?? variant.options[0]!.value;
    const index = Math.max(
      0,
      variant.options.findIndex((option) => option.value === current),
    );
    const nextIndex =
      (index + step + variant.options.length) % variant.options.length;
    state[variant.key] = structuredClone(variant.options[nextIndex]!.value);
    return document.execute(updateEntityState(inspected.ref, state));
  }

  function updateProperty(entityIndex: number, key: string, raw: string): void {
    const level = currentLevel();
    const entity = level.entities[entityIndex];
    if (!entity) return;
    const definition = registry.require(entity.type);
    const field = definition.properties?.find((item) => item.key === key);
    if (!field) return;
    const properties = { ...(entity.properties ?? {}) } as EntityProperties;
    if (raw === "") delete properties[key];
    else properties[key] = coerceFieldValue(field, raw);
    document.execute(
      updateEntityProperties(
        { index: entityIndex },
        Object.keys(properties).length ? properties : undefined,
      ),
    );
  }

  function setPaletteSize(delta: number): void {
    const sizes = [32, 40, 48, 56, 64];
    const index = Math.max(0, sizes.indexOf(paletteSize.value));
    paletteSize.value =
      sizes[Math.min(sizes.length - 1, Math.max(0, index + delta))]!;
    localStorage.setItem("bobby.editor.paletteSize", String(paletteSize.value));
  }

  return {
    document,
    snapshot,
    selection,
    hover,
    playing,
    fileDialogOpen,
    helpDialogOpen,
    paletteSize,
    inspector,
    levelMap: computed(() => toLevelMap(currentLevel())),
    stroke,
    transform,
    updateProperty,
    setPaletteSize,
    resize(width: number, height: number): void {
      document.execute(resizeDocument(width, height));
    },
    setMaxMoves(value: number | null): void {
      document.execute(updateMaxMoves(value));
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

function coerceFieldValue(field: EntityFieldDefinition, raw: string): JsonValue {
  if (field.kind === "number") {
    const value = Number(raw);
    return Number.isFinite(value) ? value : raw;
  }
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
