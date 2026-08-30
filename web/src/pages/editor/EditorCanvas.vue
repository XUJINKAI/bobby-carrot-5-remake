<script setup lang="ts">
import {
  EditorCanvasInput,
  EditorCanvasRenderer,
  EditorViewport,
  type Cell,
  type EditorCanvasContextMenuRequest,
  type EditorLevel,
  type EditorPlacementPreset,
  type EditorSelection,
  type EditorTool,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine/authoring";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  level: Readonly<EditorLevel>;
  revision: number;
  tool: EditorTool;
  placement: EditorPlacementPreset | null;
  selection: EditorSelection | null;
  hover: Cell | null;
  enabled: boolean;
  images: ImageManager;
}>();
const emit = defineEmits<{
  hover: [cell: Cell | null];
  primaryStart: [cell: Cell];
  primaryMove: [cell: Cell];
  primaryEnd: [cell: Cell | null];
  contextMenu: [request: EditorCanvasContextMenuRequest];
  transform: [cell: Cell, step: number, result: (changed: boolean) => void];
}>();
const canvas = ref<HTMLCanvasElement | null>(null);
const viewport = new EditorViewport();
let renderer: EditorCanvasRenderer | null = null;
let input: EditorCanvasInput | null = null;

function render(): void {
  renderer?.render({
    level: props.level as EditorLevel,
    tool: props.tool,
    placement: props.placement,
    selection: props.selection,
    hover: props.hover,
    viewport: viewport.snapshot,
  });
}

watch(() => [props.revision, props.tool, props.placement, props.selection, props.hover, props.enabled], () => {
  input?.setEnabled(props.enabled);
  render();
}, { deep: true });

onMounted(async () => {
  if (!canvas.value) return;
  renderer = new EditorCanvasRenderer(canvas.value, props.images);
  input = new EditorCanvasInput(canvas.value, viewport, {
    dimensions: () => ({ width: props.level.width, height: props.level.height }),
    hover: (cell) => emit("hover", cell),
    primaryStart: (cell) => emit("primaryStart", cell),
    primaryMove: (cell) => emit("primaryMove", cell),
    primaryEnd: (cell) => emit("primaryEnd", cell),
    contextMenu: (request) => emit("contextMenu", request),
    transform: (cell, step) => {
      let changed = false;
      emit("transform", cell, step, (result) => { changed = result; });
      return changed;
    },
    viewportChanged: render,
  });
  await renderer.load();
  render();
});

onBeforeUnmount(() => input?.destroy());
</script>

<template><canvas ref="canvas" class="editor-canvas" aria-label="地图编辑画布" /></template>
