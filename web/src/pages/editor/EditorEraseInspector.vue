<script setup lang="ts">
import { webT } from "../../i18n/webI18n.js";
import {
  isSurfaceEntityType,
  type EditorDefinition,
  type EngineEnvironment,
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
  environment: EngineEnvironment;
  editor: EditorDefinition;
}>();
</script>

<template>
  <div class="editor-erase-inspector">
    <section class="editor-inspector-section editor-delete-summary editor-inspector-summary">
      <span class="editor-tool-kicker">{{ webT("editor.eraseTool") }}</span>
      <template v-if="model.mode === 'cell'">
        <strong>{{ webT("editor.cellAt", { x: model.rect?.left ?? 0, y: model.rect?.top ?? 0 }) }}</strong>
        <span class="editor-muted">{{ webT("editor.layerCount", { count: model.entityCount }) }}</span>
      </template>
      <span v-else class="editor-muted">{{ webT("editor.eraseHoverHint") }}</span>
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
          :environment="environment"
          :editor="editor"
          :fallback-text="layer.label.slice(0, 2)"
        />
        <span class="editor-delete-layer-name">
          <strong>{{ layer.label }}</strong>
          <code>{{ layer.entity.type }}</code>
        </span>
        <span v-if="layer.role" class="editor-layer-meta">{{ layer.role }}</span>
        <span v-if="layer.ref.index === targetIndex" class="editor-delete-target">{{ webT("editor.clickToDelete") }}</span>
        <span v-else-if="isSurfaceEntityType(layer.entity.type)" class="editor-layer-meta">Surface</span>
        <span v-else class="editor-layer-meta">z {{ layer.stackOrder }}</span>
      </article>
    </div>
    <section
      v-else-if="model.mode === 'cell'"
      class="editor-inspector-section editor-muted"
    >
      {{ webT("editor.emptyEraseCell") }}
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
