<script setup lang="ts">
import {
  type EditorDefinition,
  type EditorTool,
  type EntityCatalog,
  type InspectorModel,
  type PaletteItem,
  type PlacementInspectorPreviewModel,
  type SurfaceBrush,
  type SurfaceTool,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { EntityType, LevelEntityFieldValue } from "@bobby/model";
import { computed } from "vue";
import EditorCellInspector from "./EditorCellInspector.vue";
import EditorEraseInspector from "./EditorEraseInspector.vue";
import EditorMultiInspector from "./EditorMultiInspector.vue";
import EditorPlacementInspector from "./EditorPlacementInspector.vue";
import EditorSurfaceToolInspector from "./EditorSurfaceToolInspector.vue";

const props = defineProps<{
  model: InspectorModel;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
  authoringPanel: "palette" | "surface";
  paletteTool: EditorTool;
  surfaceTool: SurfaceTool;
  placement: PaletteItem;
  surfaceBrush: SurfaceBrush;
  hoverModel: InspectorModel;
  placementPreview: PlacementInspectorPreviewModel;
  deletionTargetIndex: number | null;
}>();
const emit = defineEmits<{
  field: [entityIndex: number, key: string, value: LevelEntityFieldValue];
  variant: [entityIndex: number, index: number];
  surfaceVariant: [entityIndex: number, type: EntityType];
  deleteLayer: [entityIndex: number];
  reorder: [refsTopToBottom: number[]];
  batchField: [type: string, key: string, value: LevelEntityFieldValue];
  batchVariant: [type: string, index: number];
  batchSurfaceVariant: [type: string, variantType: EntityType];
  batchDelete: [type: string];
  placementField: [key: string, value: LevelEntityFieldValue];
  placementVariant: [index: number];
}>();

const showPlacement = computed(
  () => props.authoringPanel === "palette" && props.paletteTool === "place",
);
const showDeletion = computed(
  () => props.authoringPanel === "palette" && props.paletteTool === "erase",
);
const showSurfaceTool = computed(
  () => props.authoringPanel === "surface" && props.surfaceTool !== "rect",
);
</script>

<template>
  <aside class="editor-inspector">
    <div class="editor-panel-title">Inspector</div>
    <EditorPlacementInspector
      v-if="showPlacement"
      :placement="placement"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      :hover-preview="placementPreview"
      @field="(key, value) => emit('placementField', key, value)"
      @variant="emit('placementVariant', $event)"
    />
    <EditorEraseInspector
      v-else-if="showDeletion"
      :model="hoverModel"
      :target-index="deletionTargetIndex"
      :images="images"
      :catalog="catalog"
      :editor="editor"
    />
    <EditorSurfaceToolInspector
      v-else-if="showSurfaceTool"
      :tool="surfaceTool"
      :brush="surfaceBrush"
      :images="images"
      :catalog="catalog"
      :editor="editor"
    />
    <section
      v-else-if="model.mode === 'none'"
      class="editor-inspector-section editor-empty-selection editor-inspector-summary"
    >
      <strong>选择工具</strong>
      <span class="editor-muted">点选一个格子，或拖动框选多个格子。</span>
    </section>
    <EditorCellInspector
      v-else-if="model.mode === 'cell'"
      :model="model"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @field="(entityIndex, key, value) => emit('field', entityIndex, key, value)"
      @variant="(entityIndex, index) => emit('variant', entityIndex, index)"
      @surface-variant="(entityIndex, type) => emit('surfaceVariant', entityIndex, type)"
      @delete="emit('deleteLayer', $event)"
      @reorder="emit('reorder', $event)"
    />
    <EditorMultiInspector
      v-else
      :model="model"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @field="(type, key, value) => emit('batchField', type, key, value)"
      @variant="(type, index) => emit('batchVariant', type, index)"
      @surface-variant="(type, variantType) => emit('batchSurfaceVariant', type, variantType)"
      @delete-type="emit('batchDelete', $event)"
    />
  </aside>
</template>

<style scoped>
.editor-empty-selection {
  display: grid;
  gap: 4px;
}
</style>
