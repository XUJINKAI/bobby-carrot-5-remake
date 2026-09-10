<script setup lang="ts">
import type {
  EditorDefinition,
  EntityCatalog,
  InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import EditorEntityPreview from "./EditorEntityPreview.vue";
import { placementPresetFromEntity } from "./editorFieldValues.js";

defineProps<{
  title: string;
  model: InspectorModel;
  highlightIndex?: number | null;
  highlightLabel?: string;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
</script>

<template>
  <section class="editor-compact-stack">
    <header>
      <strong>{{ title }}</strong>
      <span>{{ model.entityCount }} 层 · 顶层在前</span>
    </header>
    <div v-if="model.mode === 'cell' && model.layers.length" class="editor-compact-layers">
      <article
        v-for="layer in model.layers"
        :key="layer.ref.index"
        :class="{ highlighted: layer.ref.index === highlightIndex }"
      >
        <EditorEntityPreview
          :source="placementPresetFromEntity(layer.entity)"
          :cell-size="28"
          :images="images"
          :catalog="catalog"
          :editor="editor"
          :fallback-text="layer.label.slice(0, 2)"
        />
        <span class="editor-compact-layer-name">
          <strong>{{ layer.label }}</strong>
          <code>{{ layer.entity.type }}</code>
        </span>
        <span
          v-if="layer.ref.index === highlightIndex && highlightLabel"
          class="editor-compact-layer-badge"
        >{{ highlightLabel }}</span>
        <span v-else class="editor-compact-layer-order">
          <template v-if="layer.role">{{ layer.role }} · </template>z {{ layer.stackOrder }}
        </span>
      </article>
    </div>
    <span v-else class="editor-muted">空</span>
  </section>
</template>

<style scoped>
.editor-compact-stack {
  min-width: 0;
  padding: 8px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 8px;
  background: rgb(0 20 45 / 24%);
}
.editor-compact-stack > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 7px;
}
.editor-compact-stack > header strong {
  font-size: 0.7rem;
}
.editor-compact-stack > header span {
  color: var(--editor-muted);
  font-size: 0.58rem;
}
.editor-compact-layers {
  display: grid;
  gap: 4px;
}
.editor-compact-layers article {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: rgb(0 15 35 / 32%);
}
.editor-compact-layers article.highlighted {
  border-color: #8ee7ff;
  background: rgb(11 104 156 / 35%);
}
.editor-compact-layer-name {
  display: grid;
  min-width: 0;
}
.editor-compact-layer-name strong,
.editor-compact-layer-name code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor-compact-layer-name strong {
  font-size: 0.66rem;
}
.editor-compact-layer-name code {
  color: var(--editor-muted);
  font-size: 0.56rem;
}
.editor-compact-layer-order,
.editor-compact-layer-badge {
  font-size: 0.56rem;
  white-space: nowrap;
}
.editor-compact-layer-order {
  color: var(--editor-muted);
  font-family: ui-monospace, monospace;
}
.editor-compact-layer-badge {
  padding: 2px 4px;
  border-radius: 4px;
  background: #0b689c;
  color: #fff;
  font-weight: 800;
}
</style>
