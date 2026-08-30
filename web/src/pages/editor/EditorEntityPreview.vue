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
  fallbackText?: string;
}>();
const canvas = ref<HTMLCanvasElement | null>(null);
const rendered = ref(true);
let renderer: EditorEntityPreviewRenderer | null = null;

function draw(): void {
  if (!canvas.value) return;
  renderer ??= new EditorEntityPreviewRenderer(
    props.images,
    props.catalog,
    props.editor,
  );
  rendered.value = renderer.render(canvas.value, props.source, props.cellSize);
}

watch(
  () => [props.source, props.cellSize, props.images, props.catalog, props.editor],
  draw,
  { deep: true },
);
onMounted(draw);
</script>

<template>
  <span class="editor-entity-preview-shell">
    <canvas
      ref="canvas"
      class="editor-entity-preview"
      :class="{ hidden: !rendered }"
      aria-hidden="true"
    />
    <span v-if="!rendered" class="editor-entity-preview-fallback" aria-hidden="true">
      {{ fallbackText ?? source.type.slice(0, 2).toUpperCase() }}
    </span>
  </span>
</template>

<style scoped>
.editor-entity-preview-shell {
  position: relative;
  display: grid;
  place-items: center;
}
.editor-entity-preview {
  display: block;
  image-rendering: pixelated;
}
.editor-entity-preview.hidden {
  visibility: hidden;
}
.editor-entity-preview-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.72rem;
}
</style>
