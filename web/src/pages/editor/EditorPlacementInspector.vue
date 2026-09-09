<script setup lang="ts">
import {
  editorCatalogEntry,
  type EditorDefinition,
  type EntityCatalog,
  type PaletteItem,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { LevelEntity } from "@bobby/model";
import { computed } from "vue";
import EditorEntityFields from "./EditorEntityFields.vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";

const props = defineProps<{
  placement: PaletteItem;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  variant: [index: number];
}>();

const entity = computed<LevelEntity>(() => ({
  ...(props.placement.fields ?? {}),
  type: props.placement.type,
  x: 0,
  y: 0,
}));
const definition = computed(() =>
  editorCatalogEntry(props.catalog, entity.value),
);
</script>

<template>
  <div class="editor-placement-inspector">
    <section class="editor-inspector-section editor-tool-summary">
      <span class="editor-tool-kicker">画笔 · 当前素材</span>
      <div class="editor-placement-current">
        <EditorEntityPreview
          :source="placement.previewPreset"
          :cell-size="48"
          :images="images"
          :catalog="catalog"
          :editor="editor"
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
        :targets="[entity]"
        :definition="definition"
        :entity-policy="editor.entities?.[placement.type]"
        :images="images"
        :catalog="catalog"
        :editor="editor"
        :show-map-fields="false"
        empty-text="该素材没有可切换的 variant。"
        @variant="emit('variant', $event)"
      />
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
</style>
