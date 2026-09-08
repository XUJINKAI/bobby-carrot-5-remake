<script setup lang="ts">
import type {
  EditorDefinition,
  EntityCatalog,
  InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import { ref } from "vue";
import EditorEntityFields from "./EditorEntityFields.vue";

const props = defineProps<{
  model: InspectorModel;
  showSurface: boolean;
  surfaceCount: number;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  toggleSurface: [];
  field: [entityIndex: number, key: string, value: string];
  variant: [entityIndex: number, index: number];
  surfaceVariant: [entityIndex: number, type: EntityType];
  delete: [entityIndex: number];
  reorder: [refsTopToBottom: number[]];
}>();
const dragging = ref<number | null>(null);

function startDrag(index: number, event: DragEvent): void {
  dragging.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

function dropAt(index: number): void {
  const from = dragging.value;
  dragging.value = null;
  if (from === null || from === index) return;
  const order = props.model.layers.map((layer) => layer.ref.index);
  const [moved] = order.splice(from, 1);
  if (moved === undefined) return;
  order.splice(index, 0, moved);
  emit("reorder", order);
}
</script>

<template>
  <div class="editor-cell-inspector">
    <section class="editor-inspector-section editor-selection-summary">
      <span class="editor-summary-text">
        <strong>格子 {{ model.rect?.left }}, {{ model.rect?.top }}</strong>
        <span class="editor-muted">{{ model.entityCount }} 层 · 顶层在前</span>
      </span>
      <button
        v-if="surfaceCount > 0"
        type="button"
        class="editor-surface-toggle"
        :class="{ active: showSurface }"
        :title="showSurface ? '隐藏 Surface' : `显示 ${surfaceCount} 个 Surface`"
        @click="emit('toggleSurface')"
      >Surface</button>
    </section>

    <div v-if="model.layers.length" class="editor-layer-stack">
      <article
        v-for="(layer, index) in model.layers"
        :key="layer.ref.index"
        class="editor-layer-card"
        :class="{ dragging: dragging === index }"
        draggable="true"
        @dragstart="startDrag(index, $event)"
        @dragend="dragging = null"
        @dragover.prevent
        @drop.prevent="dropAt(index)"
      >
        <header class="editor-layer-head">
          <span class="editor-layer-drag" title="拖动调整叠加顺序" aria-hidden="true">⠿</span>
          <span class="editor-layer-title">
            <strong>{{ layer.label }}</strong>
            <code>{{ layer.entity.type }}</code>
          </span>
          <span class="editor-layer-order">z {{ layer.stackOrder }}</span>
          <button
            type="button"
            class="editor-layer-delete"
            title="删除这一层"
            @click="emit('delete', layer.ref.index)"
          >
            ✕
          </button>
        </header>
        <EditorEntityFields
          :targets="[layer.entity]"
          :definition="layer.definition"
          :entity-policy="layer.editor"
          :images="images"
          :catalog="catalog"
          :editor="editor"
          @field="(key, value) => emit('field', layer.ref.index, key, value)"
          @variant="(variantIndex) => emit('variant', layer.ref.index, variantIndex)"
          @surface-variant="(type) => emit('surfaceVariant', layer.ref.index, type)"
        />
      </article>
    </div>
    <div v-else class="editor-inspector-section editor-muted">
      这个格子没有可见 Entity。
    </div>
  </div>
</template>

<style scoped>
.editor-selection-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.editor-summary-text {
  display: grid;
  min-width: 0;
  gap: 2px;
}
.editor-surface-toggle {
  flex: 0 0 auto;
  padding: 4px 7px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 5px;
  background: rgb(0 20 45 / 28%);
  color: var(--editor-muted);
  font-size: 10px;
  cursor: pointer;
}
.editor-surface-toggle.active {
  border-color: #8bdfff;
  background: #0b689c;
  color: #fff;
}
.editor-layer-stack {
  display: grid;
  gap: 10px;
}
.editor-layer-card {
  display: grid;
  gap: 12px;
  padding: 10px;
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: 8px;
  background: rgb(0 20 45 / 24%);
}
.editor-layer-card.dragging {
  opacity: 0.48;
}
.editor-layer-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 7px;
}
.editor-layer-drag {
  cursor: grab;
  color: var(--editor-muted);
  font-size: 18px;
}
.editor-layer-title {
  display: grid;
  min-width: 0;
}
.editor-layer-title code {
  overflow: hidden;
  color: var(--editor-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor-layer-order {
  color: var(--editor-muted);
  font: 10px ui-monospace, monospace;
}
.editor-layer-delete {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--panel2);
  color: inherit;
}
.editor-layer-delete:hover {
  background: #713a43;
}
</style>
