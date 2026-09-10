<script setup lang="ts">
import {
  editorCatalogEntry,
  type EditorDefinition,
  type EntityCatalog,
  type PaletteItem,
  type PlacementInspectorPreviewModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import { computed } from "vue";
import EditorEntityFields from "./EditorEntityFields.vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";
import EditorInspectorStack from "./EditorInspectorStack.vue";

const props = defineProps<{
  placement: PaletteItem;
  hoverPreview: PlacementInspectorPreviewModel;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  field: [key: string, value: string];
  variant: [index: number];
}>();

const entity = computed<LevelEntity>(() => ({
  ...(props.placement.fields ?? {}),
  type: props.placement.type,
  x: 0,
  y: 0,
}));
const targets = computed<readonly LevelEntity[]>(() => [entity.value]);
const definition = computed(() =>
  editorCatalogEntry(props.catalog, entity.value),
);
</script>

<template>
  <div class="editor-placement-inspector">
    <section class="editor-inspector-section editor-tool-summary editor-inspector-summary">
      <span class="editor-tool-kicker">画笔 · 当前素材</span>
      <div class="editor-placement-current">
        <EditorEntityPreview
          :source="placement.previewPreset"
          :cell-size="48"
          :images="images"
          :catalog="catalog"
          :editor="editor"
          :preview-state="placement.preview?.state"
          :fallback-text="placement.label.slice(0, 2)"
        />
        <span>
          <strong>{{ placement.label }}</strong>
          <code>{{ placement.type }}</code>
        </span>
      </div>
    </section>
    <section class="editor-inspector-section">
      <EditorEntityFields
        :targets="targets"
        :definition="definition"
        :entity-policy="editor.entities?.[placement.type]"
        :images="images"
        :catalog="catalog"
        :editor="editor"
        empty-text="该素材没有可编辑字段或 variant。"
        @field="(key, value) => emit('field', key, value)"
        @variant="emit('variant', $event)"
      />
    </section>
    <section class="editor-inspector-section editor-placement-hover">
      <template v-if="hoverPreview.cell">
        <header class="editor-placement-hover-head">
          <span>
            <strong>放置结果</strong>
            <small>格子 {{ hoverPreview.cell.x }}, {{ hoverPreview.cell.y }}</small>
          </span>
          <span v-if="hoverPreview.replacedCount > 0" class="editor-replace-count">
            替换 {{ hoverPreview.replacedCount }} 个 Entity
          </span>
          <span v-else-if="!hoverPreview.valid" class="editor-invalid-placement">
            无法放置
          </span>
        </header>
        <div class="editor-placement-stack-result">
          <EditorInspectorStack
            title="放置后"
            :model="hoverPreview.after"
            :highlight-index="hoverPreview.placedIndex"
            highlight-label="新增"
            :images="images"
            :catalog="catalog"
            :editor="editor"
          />
        </div>
      </template>
      <p v-else class="editor-muted editor-placement-hover-empty">
        将指针移到画布格子上，查看放置后的完整堆叠。
      </p>
    </section>
  </div>
</template>

<style scoped>
.editor-tool-summary {
  display: grid;
  gap: 10px;
}
.editor-tool-kicker {
  color: #8ee7ff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.editor-placement-current {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 9px;
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: 8px;
  background: rgb(0 20 45 / 24%);
}
.editor-placement-current > span {
  display: grid;
  min-width: 0;
  gap: 3px;
}
.editor-placement-current code {
  overflow: hidden;
  color: var(--editor-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor-placement-hover {
  display: grid;
  gap: 8px;
}
.editor-placement-hover-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 8px;
}
.editor-placement-hover-head > span:first-child {
  display: grid;
  gap: 2px;
}
.editor-placement-hover-head small {
  color: var(--editor-muted);
  font-size: 0.62rem;
}
.editor-replace-count,
.editor-invalid-placement {
  font-size: 0.62rem;
  font-weight: 700;
}
.editor-replace-count {
  color: #8ee7ff;
}
.editor-invalid-placement {
  color: #ffb4a9;
}
.editor-placement-stack-result {
  min-width: 0;
}
.editor-placement-hover-empty {
  margin: 0;
}
</style>
