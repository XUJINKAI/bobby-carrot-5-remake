<script setup lang="ts">
import {
  EditorCanvasInput,
  EditorCanvasRenderer,
  EditorViewport,
  type Cell,
  type EditorLevel,
  type PaletteItem,
} from "@bobby/editor";
import type { VisualAssetSources } from "@bobby/engine";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  level: Readonly<EditorLevel>;
  revision: number;
  placementSequence: number;
  selection: PaletteItem;
  hover: Cell | null;
  enabled: boolean;
  visualAssets: VisualAssetSources;
}>();
const emit = defineEmits<{
  hover: [cell: Cell | null];
  stroke: [cell: Cell, button: 0 | 2];
  beginStroke: [];
  endStroke: [];
  transform: [cell: Cell, step: number, result: (changed: boolean) => void];
}>();
const canvas = ref<HTMLCanvasElement | null>(null);
const viewport = new EditorViewport();
let renderer: EditorCanvasRenderer | null = null;
let input: EditorCanvasInput | null = null;
let replacing = false;

function render(): void {
  renderer?.render({
    level: props.level as EditorLevel,
    selection: props.selection,
    hover: props.hover,
    replacing,
    placementSequence: props.placementSequence,
    viewport: viewport.snapshot,
  });
}

watch(
  () => [
    props.revision,
    props.placementSequence,
    props.selection,
    props.hover,
    props.enabled,
  ],
  () => {
    input?.setEnabled(props.enabled);
    render();
  },
  { deep: true },
);

onMounted(async () => {
  if (!canvas.value) return;
  renderer = new EditorCanvasRenderer(canvas.value, props.visualAssets);
  input = new EditorCanvasInput(canvas.value, viewport, {
    dimensions: () => ({ width: props.level.width, height: props.level.height }),
    hover: (cell) => emit("hover", cell),
    stroke: (cell, button) => emit("stroke", cell, button),
    beginStroke: () => {
      replacing = true;
      emit("beginStroke");
      render();
    },
    endStroke: () => {
      replacing = false;
      emit("endStroke");
      render();
    },
    transform: (cell, step) => {
      let changed = false;
      emit("transform", cell, step, (result) => {
        changed = result;
      });
      return changed;
    },
    viewportChanged: render,
  });
  await renderer.load();
  render();
});

onBeforeUnmount(() => input?.destroy());
</script>

<template>
  <canvas ref="canvas" class="editor-canvas" aria-label="地图编辑画布" />
</template>
