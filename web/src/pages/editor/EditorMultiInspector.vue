<script setup lang="ts">
import type {
  EditorDefinition,
  EntityCatalog,
  InspectorModel,
} from "@bobby/editor";
import { isSurfaceEntityType } from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import EditorEntityFields from "./EditorEntityFields.vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";
import { placementPresetFromEntity } from "./editorFieldValues.js";
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{
  model: InspectorModel;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  field: [type: string, key: string, value: string];
  variant: [type: string, index: number];
  surfaceVariant: [entityType: string, variantType: EntityType];
  deleteType: [type: string];
}>();
</script>

<template>
  <div class="editor-multi-inspector">
    <section class="editor-inspector-section editor-selection-summary editor-inspector-summary">
      <span class="editor-summary-text">
        <span class="editor-tool-kicker">选择工具 · 框选</span>
        <strong>{{ model.rect?.width }} × {{ model.rect?.height }} 选区</strong>
        <span class="editor-muted">{{ model.entityCount }} Entities</span>
      </span>
    </section>

    <div v-if="model.groups.length" class="editor-batch-groups">
      <template v-for="(group, index) in model.groups" :key="group.type">
        <div
          v-if="
            isSurfaceEntityType(group.type) &&
            (index === 0 || !isSurfaceEntityType(model.groups[index - 1]!.type))
          "
          class="editor-batch-divider"
          :class="{ standalone: index === 0 }"
        >
          <span>Surface</span>
        </div>
        <article class="editor-batch-card">
          <header class="editor-batch-head">
            <EditorEntityPreview
              :source="placementPresetFromEntity(group.entities[0]!)"
              :cell-size="34"
              :images="images"
              :catalog="catalog"
              :editor="editor"
              :fallback-text="group.label.slice(0, 2)"
            />
            <span class="editor-batch-title">
              <strong>{{ group.label }}</strong>
              <code>{{ group.type }}</code>
            </span>
            <span class="editor-batch-count">× {{ group.count }}</span>
            <button
              type="button"
              class="editor-batch-delete"
              :title="`删除选区内全部 ${group.label}`"
              :aria-label="`删除选区内全部 ${group.label}`"
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
      </template>
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
.editor-batch-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  margin: 6px 0 2px;
  color: #8ee7ff;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.editor-batch-divider::before,
.editor-batch-divider::after {
  content: "";
  height: 1px;
  background: rgb(142 231 255 / 35%);
}
.editor-batch-divider.standalone {
  margin-top: 0;
}
.editor-batch-head {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto auto;
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
