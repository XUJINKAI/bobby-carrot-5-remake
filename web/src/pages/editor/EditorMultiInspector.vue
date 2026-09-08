<script setup lang="ts">
import type {
  EditorDefinition,
  EntityCatalog,
  InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import EditorEntityFields from "./EditorEntityFields.vue";
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{
  model: InspectorModel;
  showSurface: boolean;
  surfaceCount: number;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  toggleSurface: [];
  field: [type: string, key: string, value: string];
  variant: [type: string, index: number];
  surfaceVariant: [entityType: string, variantType: EntityType];
  deleteType: [type: string];
}>();
</script>

<template>
  <div class="editor-multi-inspector">
    <section class="editor-inspector-section editor-selection-summary">
      <span class="editor-summary-text">
        <strong>{{ model.rect?.width }} × {{ model.rect?.height }} 选区</strong>
        <span class="editor-muted">{{ model.entityCount }} Entities</span>
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

    <div v-if="model.groups.length" class="editor-batch-groups">
      <article
        v-for="group in model.groups"
        :key="group.type"
        class="editor-batch-card"
      >
        <header class="editor-batch-head">
          <span class="editor-batch-title">
            <strong>{{ group.label }}</strong>
            <code>{{ group.type }}</code>
          </span>
          <span class="editor-batch-count">× {{ group.count }}</span>
          <button
            type="button"
            class="editor-batch-delete"
            :title="`删除选区内全部 ${group.label}`"
            @click="emit('deleteType', group.type)"
          >
            <AppIcon name="delete" />
          </button>
        </header>
        <EditorEntityFields
          :targets="group.entities"
          :definition="group.definition"
          :entity-policy="group.editor"
          :images="images"
          :catalog="catalog"
          :editor="editor"
          @field="(key, value) => emit('field', group.type, key, value)"
          @variant="(variantIndex) => emit('variant', group.type, variantIndex)"
          @surface-variant="(variantType) => emit('surfaceVariant', group.type, variantType)"
        />
      </article>
    </div>
    <div v-else class="editor-inspector-section editor-muted">
      选区内没有可见 Entity。
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
