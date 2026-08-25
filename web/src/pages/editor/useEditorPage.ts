import {
  EditorDocument,
  buildInspectorModel,
  paintTerrain,
  placeObject,
  removeObject,
  resizeDocument,
  toLevelMap,
  transformObject,
  updateMetadata,
  updateMaxMoves,
  updateObjectProperty,
  updateObjectTrait,
  type Cell,
  type EditorLevel,
  type EditorSnapshot,
  type PaletteItem,
} from "@bobby/editor";
import { Terrain } from "@bobby/engine";
import { computed, onUnmounted, ref, shallowRef } from "vue";

export function useEditorPage(initialLevel: EditorLevel) {
  const document = new EditorDocument(initialLevel);
  const snapshot = shallowRef<EditorSnapshot>(document.getSnapshot());
  const selection = ref<PaletteItem>({ kind: "terrain", type: Terrain.GROUND_C });
  const hover = ref<Cell | null>(null);
  const playing = ref(false);
  const fileDialogOpen = ref(false);
  const helpDialogOpen = ref(false);
  const paletteSize = ref(readPaletteSize());
  const unsubscribe = document.subscribe((next) => {
    snapshot.value = next;
  });
  onUnmounted(unsubscribe);

  const inspector = computed(() =>
    buildInspectorModel(
      snapshot.value.level as EditorLevel,
      hover.value,
      selection.value,
    ),
  );

  function stroke(cell: Cell, button: 0 | 2): void {
    if (button === 2) document.execute(removeObject(cell));
    else if (selection.value.kind === "terrain")
      document.execute(paintTerrain(cell, selection.value.type));
    else document.execute(placeObject(cell, selection.value.type));
  }

  function setPaletteSize(delta: number): void {
    const sizes = [32, 40, 48, 56, 64];
    const index = Math.max(0, sizes.indexOf(paletteSize.value));
    paletteSize.value = sizes[Math.min(sizes.length - 1, Math.max(0, index + delta))]!;
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
    levelMap: computed(() => toLevelMap(snapshot.value.level as EditorLevel)),
    stroke,
    setPaletteSize,
    transform(cell: Cell, step: number): boolean {
      return document.execute(transformObject(cell, step));
    },
    updateProperty(anchor: Cell, key: string, value: string): void {
      document.execute(updateObjectProperty(anchor, key, value));
    },
    updateTrait(anchor: Cell, trait: string, enabled: boolean): void {
      document.execute(updateObjectTrait(anchor, trait, enabled));
    },
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

function readPaletteSize(): number {
  const stored = Number(localStorage.getItem("bobby.editor.paletteSize"));
  return [32, 40, 48, 56, 64].includes(stored) ? stored : 48;
}
