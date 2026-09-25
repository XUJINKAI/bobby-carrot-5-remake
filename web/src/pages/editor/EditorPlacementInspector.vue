<script setup lang="ts">
import { webT } from "../../i18n/webI18n.js";
import {
  editorCatalogEntry,
  type EditorDefinition,
  type EngineEnvironment,
  type EntityCatalog,
  type PaletteItem,
  type PlacementInspectorPreviewModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { LevelEntity, LevelEntityFieldValue } from "@bobby/model";
import { computed } from "vue";
import EditorEntityFields from "./EditorEntityFields.vue";
import EditorEntityPreview from "./EditorEntityPreview.vue";
import EditorInspectorStack from "./EditorInspectorStack.vue";

const props = defineProps<{
  placement: PaletteItem;
  hoverPreview: PlacementInspectorPreviewModel;
  images: ImageManager;
  environment: EngineEnvironment;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  field: [key: string, value: LevelEntityFieldValue];
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
const warningSummaries = computed(() => [
  ...new Set(
    props.hoverPreview.warnings.map(
      (warning) => `${warning.existingType} · ${warning.existingSlot}`,
    ),
  ),
]);
</script>

<template>
  <div class="editor-placement-inspector">
    <section class="editor-inspector-section editor-tool-summary editor-inspector-summary">
      <span class="editor-tool-kicker">{{ webT("editor.brush") }} · {{ webT("editor.currentMaterial") }}</span>
      <div class="editor-placement-current">
        <EditorEntityPreview
          :source="placement.previewPreset"
          :cell-size="48"
          :images="images"
          :environment="environment"
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
        :environment="environment"
        :catalog="catalog"
        :editor="editor"
        :empty-text="webT('editor.emptyMaterialFields')"
        @field="(key, value) => emit('field', key, value)"
        @variant="emit('variant', $event)"
      />
    </section>
    <section class="editor-inspector-section editor-placement-hover">
      <template v-if="hoverPreview.cell">
        <header class="editor-placement-hover-head">
          <span>
            <strong>{{ webT("editor.placementResult") }}</strong>
            <small>{{ webT("editor.cellAt", { x: hoverPreview.cell.x, y: hoverPreview.cell.y }) }}</small>
          </span>
          <span v-if="hoverPreview.replacedCount > 0" class="editor-replace-count">
            {{ webT("editor.replacedCount", { count: hoverPreview.replacedCount }) }}
          </span>
          <span v-else-if="!hoverPreview.valid" class="editor-invalid-placement">
            {{ webT("editor.cannotPlace") }}
          </span>
        </header>
        <div v-if="warningSummaries.length" class="editor-stack-warning">
          <strong>{{ webT("editor.stackWarning") }}</strong>
          <span>{{ warningSummaries.join("；") }}</span>
        </div>
        <div class="editor-placement-stack-result">
          <EditorInspectorStack
            :title="webT('editor.afterPlacement')"
            :model="hoverPreview.after"
            :highlight-index="hoverPreview.placedIndex"
            :highlight-label="webT('editor.added')"
            :images="images"
            :environment="environment"
            :catalog="catalog"
            :editor="editor"
          />
        </div>
      </template>
      <p v-else class="editor-muted editor-placement-hover-empty">
        {{ webT("editor.placementHoverHint") }}
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
.editor-stack-warning {
  display: grid;
  gap: 2px;
  padding: 7px 8px;
  border: 1px solid rgb(245 189 103 / 55%);
  border-radius: 6px;
  background: rgb(112 73 16 / 28%);
  color: #f5d59f;
  font-size: 0.62rem;
  line-height: 1.4;
}
.editor-placement-stack-result {
  min-width: 0;
}
.editor-placement-hover-empty {
  margin: 0;
}
</style>
