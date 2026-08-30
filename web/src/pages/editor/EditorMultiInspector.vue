<script setup lang="ts">
import type {
  EditorDefinition,
  EntityCatalog,
  InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import EditorEntityFields from "./EditorEntityFields.vue";

const props = defineProps<{
  model: InspectorModel;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  property: [type: string, key: string, value: string];
  state: [type: string, key: string, value: string];
  variant: [type: string, index: number];
  deleteType: [type: string];
}>();
</script>

<template>
  <div class="editor-multi-inspector">
    <section class="editor-inspector-section editor-selection-summary">
      <strong>{{ model.rect?.width }} × {{ model.rect?.height }} 选区</strong>
      <span class="editor-muted">{{ model.entityCount }} Entities</span>
    </section>

    <div class="editor-batch-groups">
      <article
        v-for="group in model.groups"
        :key="group.type"
        class="editor-batch-card"
      >
        <header class="editor-batch-head">
          <span class="editor-batch-title">
            <strong>{{ group.definition.presentation.name }}</strong>
            <code>{{ group.type }}</code>
          </span>
          <span class="editor-batch-count">× {{ group.count }}</span>
          <button
            type="button"
            class="editor-batch-delete"
            :title="`删除选区内全部 ${group.definition.presentation.name}`"
            @click="emit('deleteType', group.type)"
          >
            ✕
          </button>
        </header>
        <EditorEntityFields
          :targets="group.entities"
          :definition="group.definition"
          :entity-policy="group.editor"
          :images="images"
          :catalog="catalog"
          :editor="editor"
          @property="(key, value) => emit('property', group.type, key, value)"
          @state="(key, value) => emit('state', group.type, key, value)"
          @variant="(variantIndex) => emit('variant', group.type, variantIndex)"
        />
      </article>
    </div>
  </div>
</template>

<style scoped>
.editor-selection-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.editor-batch-groups {
  display: grid;
  gap: 10px;
}
.editor-batch-card {
  display: grid;
  gap: 12px;
  padding: 10px;
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: 8px;
  background: rgb(0 20 45 / 24%);
}
.editor-batch-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
}
.editor-batch-title {
  display: grid;
  min-width: 0;
}
.editor-batch-title code {
  overflow: hidden;
  color: var(--editor-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor-batch-count {
  color: #8ee7ff;
  font-weight: 800;
}
.editor-batch-delete {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--panel2);
  color: inherit;
}
.editor-batch-delete:hover {
  background: #713a43;
}
</style>
