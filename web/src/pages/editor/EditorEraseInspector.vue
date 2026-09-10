<script setup lang="ts">
import {
  isSurfaceEntityType,
  type EditorDefinition,
  type EntityCatalog,
  type InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import EditorEntityPreview from "./EditorEntityPreview.vue";
import { placementPresetFromEntity } from "./editorFieldValues.js";

defineProps<{
  model: InspectorModel;
  targetIndex: number | null;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
</script>

<template>
  <div class="editor-erase-inspector">
    <section class="editor-inspector-section editor-delete-summary editor-inspector-summary">
      <span class="editor-tool-kicker">删除工具</span>
      <template v-if="model.mode === 'cell'">
        <strong>格子 {{ model.rect?.left }}, {{ model.rect?.top }}</strong>
        <span class="editor-muted">{{ model.entityCount }} 层 · 顶层在前</span>
      </template>
      <span v-else class="editor-muted">将指针移到画布格子上查看删除目标。</span>
    </section>
    <div v-if="model.mode === 'cell' && model.layers.length" class="editor-delete-stack">
      <article
        v-for="layer in model.layers"
        :key="layer.ref.index"
        class="editor-delete-layer"
        :class="{
          target: layer.ref.index === targetIndex,
          surface: isSurfaceEntityType(layer.entity.type),
        }"
      >
        <EditorEntityPreview
          :source="placementPresetFromEntity(layer.entity)"
          :cell-size="32"
          :images="images"
          :catalog="catalog"
          :editor="editor"
          :fallback-text="layer.label.slice(0, 2)"
        />
        <span class="editor-delete-layer-name">
          <strong>{{ layer.label }}</strong>
          <code>{{ layer.entity.type }}</code>
        </span>
        <span v-if="layer.role" class="editor-layer-meta">{{ layer.role }}</span>
        <span v-if="layer.ref.index === targetIndex" class="editor-delete-target">点击将删除</span>
        <span v-else-if="isSurfaceEntityType(layer.entity.type)" class="editor-layer-meta">Surface</span>
        <span v-else class="editor-layer-meta">z {{ layer.stackOrder }}</span>
      </article>
    </div>
    <section
      v-else-if="model.mode === 'cell'"
      class="editor-inspector-section editor-muted"
    >
      这个格子没有可删除的 Entity。
    </section>
  </div>
</template>

<style scoped>
.editor-delete-summary {
  display: grid;
  gap: 3px;
}
.editor-tool-kicker {
  margin-bottom: 5px;
  color: #ffb4a9;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.editor-delete-stack {
  display: grid;
  gap: 7px;
}
.editor-delete-layer {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 7px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 7px;
  background: rgb(0 20 45 / 24%);
}
.editor-delete-layer.target {
  border-color: #ff8878;
  background: rgb(112 35 35 / 45%);
  box-shadow: inset 3px 0 #ff8878;
}
.editor-delete-layer.surface {
  opacity: 0.62;
}
.editor-delete-layer-name {
  display: grid;
  min-width: 0;
}
.editor-delete-layer-name code {
  overflow: hidden;
  color: var(--editor-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor-delete-target {
  color: #ffd1ca;
  font-size: 10px;
  font-weight: 800;
}
.editor-layer-meta {
  color: var(--editor-muted);
  font: 10px ui-monospace, monospace;
}
</style>
