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
import EditorEntityPreview from "./EditorEntityPreview.vue";
import { placementPresetFromEntity } from "./editorFieldValues.js";
import AppIcon from "../../shared/icons/AppIcon.vue";

const props = defineProps<{
  model: InspectorModel;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  field: [entityIndex: number, key: string, value: string];
  variant: [entityIndex: number, index: number];
  surfaceVariant: [entityIndex: number, type: EntityType];
  delete: [entityIndex: number];
  reorder: [refsTopToBottom: number[]];
}>();
const dragging = ref<number | null>(null);
const dropTarget = ref<number | null>(null);

function startDrag(index: number, event: DragEvent): void {
  dragging.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

function dropAt(index: number): void {
  const from = dragging.value;
  endDrag();
  if (from === null || from === index) return;
  const order = props.model.layers.map((layer) => layer.ref.index);
  const [moved] = order.splice(from, 1);
  if (moved === undefined) return;
  order.splice(index, 0, moved);
  emit("reorder", order);
}

function endDrag(): void {
  dragging.value = null;
  dropTarget.value = null;
}

function dropClass(index: number): string | undefined {
  if (dropTarget.value !== index || dragging.value === null) return undefined;
  return dragging.value < index ? "drop-after" : "drop-before";
}
</script>

<template>
  <div class="editor-cell-inspector">
    <section class="editor-inspector-section editor-selection-summary editor-inspector-summary">
      <span class="editor-summary-text">
        <span class="editor-tool-kicker">选择工具 · 单格</span>
        <strong>格子 {{ model.rect?.left }}, {{ model.rect?.top }}</strong>
        <span class="editor-muted">{{ model.entityCount }} 层 · 顶层在前</span>
      </span>
    </section>

    <div v-if="model.layers.length" class="editor-layer-stack">
      <article
        v-for="(layer, index) in model.layers"
        :key="layer.ref.index"
        class="editor-layer-card"
        :class="[{ dragging: dragging === index }, dropClass(index)]"
        @dragover.prevent="dropTarget = index"
        @drop.prevent="dropAt(index)"
      >
        <header class="editor-layer-head">
          <button
            v-if="model.layers.length > 1"
            type="button"
            class="editor-layer-drag"
            draggable="true"
            :aria-label="`拖动调整 ${layer.label} 的叠加顺序`"
            @dragstart="startDrag(index, $event)"
            @dragend="endDrag"
          >
            <AppIcon name="drag" />
          </button>
          <span v-else class="editor-layer-drag-spacer" />
          <EditorEntityPreview
            :source="placementPresetFromEntity(layer.entity)"
            :cell-size="34"
            :images="images"
            :catalog="catalog"
            :editor="editor"
            :fallback-text="layer.label.slice(0, 2)"
          />
          <span class="editor-layer-title">
            <strong>{{ layer.label }}</strong>
            <code>{{ layer.entity.type }}</code>
            <small v-if="layer.footprint.width > 1 || layer.footprint.height > 1">
              {{ layer.footprint.width }} × {{ layer.footprint.height }} footprint ·
              anchor {{ layer.entity.x }}, {{ layer.entity.y }}
              <template v-if="layer.role"> · {{ layer.role }}</template>
            </small>
          </span>
          <span class="editor-layer-order">z {{ layer.stackOrder }}</span>
          <button
            type="button"
            class="editor-layer-delete"
            title="删除这一层"
            :aria-label="`删除 ${layer.label}`"
            @click="emit('delete', layer.ref.index)"
          >
            <AppIcon name="delete" />
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
.editor-layer-stack {
  display: grid;
  gap: 10px;
}
.editor-layer-card {
  position: relative;
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
.editor-layer-card.drop-before::before,
.editor-layer-card.drop-after::after {
  content: "";
  position: absolute;
  right: 2px;
  left: 2px;
  height: 3px;
  border-radius: 2px;
  background: #8ee7ff;
  box-shadow: 0 0 0 1px #082f59;
}
.editor-layer-card.drop-before::before {
  top: -7px;
}
.editor-layer-card.drop-after::after {
  bottom: -7px;
}
.editor-layer-head {
  display: grid;
  grid-template-columns: 24px 34px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 7px;
}
.editor-layer-drag {
  display: grid;
  place-items: center;
  width: 24px;
  height: 30px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: grab;
  color: var(--editor-muted);
  font-size: 18px;
}
.editor-layer-drag:active {
  cursor: grabbing;
}
.editor-layer-drag-spacer {
  width: 24px;
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
.editor-layer-title small {
  margin-top: 3px;
  color: #9fc5d4;
  font-size: 9px;
  line-height: 1.35;
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
