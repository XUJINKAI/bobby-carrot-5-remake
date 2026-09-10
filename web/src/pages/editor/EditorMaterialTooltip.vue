<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { EditorMaterialTooltipModel } from "./editorMaterialTooltip.js";

const props = defineProps<{
  id: string;
  model: EditorMaterialTooltipModel;
}>();
const element = ref<HTMLElement | null>(null);
const position = ref({ left: props.model.anchor.right + 10, top: props.model.anchor.top });
const positioned = ref(false);

watch(
  () => props.model,
  async () => {
    positioned.value = false;
    await nextTick();
    placeTooltip();
  },
  { immediate: true },
);

function placeTooltip(): void {
  const tooltip = element.value;
  if (!tooltip) return;
  const gap = 10;
  const edge = 8;
  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;
  const fitsRight = props.model.anchor.right + gap + width <= window.innerWidth - edge;
  const left = fitsRight
    ? props.model.anchor.right + gap
    : props.model.anchor.left - gap - width;
  position.value = {
    left: Math.max(edge, Math.min(left, window.innerWidth - width - edge)),
    top: Math.max(
      edge,
      Math.min(props.model.anchor.top, window.innerHeight - height - edge),
    ),
  };
  positioned.value = true;
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="element"
      :id="id"
      class="editor-material-tooltip"
      role="tooltip"
      :class="{ positioned }"
      :style="{ left: `${position.left}px`, top: `${position.top}px` }"
    >
      <strong>{{ model.title }}</strong>
      <code v-if="model.code">{{ model.code }}</code>
      <div v-for="row in model.rows" :key="row.label" class="editor-material-tooltip-row">
        <span>{{ row.label }}</span>
        <span>{{ row.value }}</span>
      </div>
      <p v-if="model.hint">{{ model.hint }}</p>
    </div>
  </Teleport>
</template>

<style scoped>
.editor-material-tooltip {
  position: fixed;
  z-index: 10000;
  width: max-content;
  max-width: min(320px, calc(100vw - 16px));
  pointer-events: none;
  padding: 8px 10px;
  border: 1px solid #3d88bb;
  border-radius: 6px;
  opacity: 0;
  background: #082f59;
  color: #fff;
  box-shadow: 0 6px 20px rgb(0 0 0 / 35%);
  font-size: 12px;
}
.editor-material-tooltip.positioned {
  opacity: 1;
}
.editor-material-tooltip strong,
.editor-material-tooltip code {
  display: block;
  margin-bottom: 3px;
}
.editor-material-tooltip-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 7px;
}
.editor-material-tooltip-row > span:first-child {
  color: var(--bc-text-muted);
}
.editor-material-tooltip-row > span:last-child {
  overflow-wrap: anywhere;
}
.editor-material-tooltip p {
  margin: 6px 0 0;
  color: #c6e8ff;
  line-height: 1.4;
}
</style>
