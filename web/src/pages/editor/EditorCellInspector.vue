<script setup lang="ts">
import { webT } from "../../i18n/webI18n.js";
import type {
  EditorDefinition,
  EngineEnvironment,
  EntityCatalog,
  InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { EntityType, LevelEntityFieldValue } from "@bobby/model";
import { ref } from "vue";
import EditorEntityFields from "./EditorEntityFields.vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";
import { placementPresetFromEntity } from "./editorFieldValues.js";
import AppIcon from "../../shared/icons/AppIcon.vue";

const props = defineProps<{
  model: InspectorModel;
  images: ImageManager;
  environment: EngineEnvironment;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  field: [entityIndex: number, key: string, value: LevelEntityFieldValue];
  variant: [entityIndex: number, index: number];
  surfaceVariant: [entityIndex: number, type: EntityType];
  delete: [entityIndex: number];
  reorder: [refsTopToBottom: number[]];
}>();
const dragging = ref<number | null>(null);
const dropTarget = ref<{
  refIndex: number;
  position: "before" | "after";
} | null>(null);
let dragPointerId: number | null = null;

function startDrag(refIndex: number, event: PointerEvent): void {
  if (
    (event.pointerType !== "mouse" && event.pointerType !== "touch") ||
    (event.pointerType === "mouse" && event.button !== 0)
  ) return;
  event.preventDefault();
  dragging.value = refIndex;
  dragPointerId = event.pointerId;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function moveDrag(event: PointerEvent): void {
  if (event.pointerId !== dragPointerId || dragging.value === null) return;
  const card = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>("[data-editor-layer-ref]");
  const refIndex = Number(card?.dataset.editorLayerRef);
  if (!card || !Number.isInteger(refIndex) || refIndex === dragging.value) {
    dropTarget.value = null;
    return;
  }
  const rect = card.getBoundingClientRect();
  dropTarget.value = {
    refIndex,
    position: event.clientY < rect.top + rect.height / 2 ? "before" : "after",
  };
}

function finishDrag(event: PointerEvent): void {
  if (event.pointerId !== dragPointerId) return;
  moveDrag(event);
  const movedRef = dragging.value;
  const target = dropTarget.value;
  endDrag(event.currentTarget as HTMLElement);
  if (movedRef === null || !target) return;
  const order = props.model.layers.map((layer) => layer.ref.index);
  const from = order.indexOf(movedRef);
  if (from < 0) return;
  order.splice(from, 1);
  const targetIndex = order.indexOf(target.refIndex);
  if (targetIndex < 0) return;
  order.splice(
    targetIndex + (target.position === "after" ? 1 : 0),
    0,
    movedRef,
  );
  emit("reorder", order);
}

function cancelDrag(event: PointerEvent): void {
  if (event.pointerId !== dragPointerId) return;
  endDrag(event.currentTarget as HTMLElement);
}

function endDrag(handle: HTMLElement): void {
  if (
    dragPointerId !== null &&
    handle.hasPointerCapture(dragPointerId)
  ) handle.releasePointerCapture(dragPointerId);
  dragging.value = null;
  dropTarget.value = null;
  dragPointerId = null;
}

function dropClass(refIndex: number): string | undefined {
  if (dropTarget.value?.refIndex !== refIndex) return undefined;
  return dropTarget.value.position === "after" ? "drop-after" : "drop-before";
}
</script>

<template>
  <div class="editor-cell-inspector">
    <section class="editor-inspector-section editor-selection-summary editor-inspector-summary">
      <span class="editor-summary-text">
        <span class="editor-tool-kicker">{{ webT("editor.selectTool") }} · {{ webT("editor.singleCell") }}</span>
        <strong>{{ webT("editor.cellAt", { x: model.rect?.left ?? 0, y: model.rect?.top ?? 0 }) }}</strong>
        <span class="editor-muted">{{ webT("editor.layerCount", { count: model.entityCount }) }}</span>
      </span>
    </section>

    <div v-if="model.layers.length" class="editor-layer-stack">
      <article
        v-for="layer in model.layers"
        :key="layer.ref.index"
        class="editor-layer-card"
        :class="[{ dragging: dragging === layer.ref.index }, dropClass(layer.ref.index)]"
        :data-editor-layer-ref="layer.ref.index"
      >
        <header class="editor-layer-head">
          <button
            v-if="model.layers.length > 1"
            type="button"
            class="editor-layer-drag"
            :aria-label="webT('editor.reorderLayer', { label: layer.label })"
            @pointerdown="startDrag(layer.ref.index, $event)"
            @pointermove="moveDrag"
            @pointerup="finishDrag"
            @pointercancel="cancelDrag"
          >
            <AppIcon name="drag" />
          </button>
          <span v-else class="editor-layer-drag-spacer" />
          <EditorEntityPreview
            :source="placementPresetFromEntity(layer.entity)"
            :cell-size="34"
            :images="images"
            :environment="environment"
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
            :title="webT('editor.deleteLayer')"
            :aria-label="webT('editor.deleteNamedLayer', { label: layer.label })"
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
          :environment="environment"
          :catalog="catalog"
          :editor="editor"
          @field="(key, value) => emit('field', layer.ref.index, key, value)"
          @variant="(variantIndex) => emit('variant', layer.ref.index, variantIndex)"
          @surface-variant="(type) => emit('surfaceVariant', layer.ref.index, type)"
        />
      </article>
    </div>
    <div v-else class="editor-inspector-section editor-muted">
      {{ webT("editor.emptyCell") }}
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
  touch-action: none;
  user-select: none;
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
