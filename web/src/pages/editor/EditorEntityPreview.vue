<script setup lang="ts">
import {
  EditorEntityPreviewRenderer,
  type EditorDefinition,
  type EditorPlacementPreset,
  type EntityCatalog,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  source: EditorPlacementPreset;
  cellSize: number;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const canvas = ref<HTMLCanvasElement | null>(null);
let renderer: EditorEntityPreviewRenderer | null = null;

function draw(): void {
  if (!canvas.value) return;
  renderer ??= new EditorEntityPreviewRenderer(
    props.images,
    props.catalog,
    props.editor,
  );
  renderer.render(canvas.value, props.source, props.cellSize);
}

watch(
  () => [props.source, props.cellSize, props.images, props.catalog, props.editor],
  draw,
  { deep: true },
);
onMounted(draw);
</script>

<template>
  <canvas ref="canvas" class="editor-entity-preview" aria-hidden="true" />
</template>

<style scoped>
.editor-entity-preview {
  display: block;
  image-rendering: pixelated;
}
</style>
