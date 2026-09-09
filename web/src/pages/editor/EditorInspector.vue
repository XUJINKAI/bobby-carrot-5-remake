<script setup lang="ts">
import {
  isSurfaceEntityType,
  type EditorDefinition,
  type EditorTool,
  type EntityCatalog,
  type InspectorModel,
  type PaletteItem,
  type SurfaceBrush,
  type SurfaceTool,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { EntityType } from "@bobby/model";
import { computed, ref, watch } from "vue";
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
  deletionTargetIndex: number | null;
}>();
const emit = defineEmits<{
  field: [entityIndex: number, key: string, value: string];
  variant: [entityIndex: number, index: number];
  surfaceVariant: [entityIndex: number, type: EntityType];
  deleteLayer: [entityIndex: number];
  reorder: [refsTopToBottom: number[]];
  batchField: [type: string, key: string, value: string];
  batchVariant: [type: string, index: number];
  batchSurfaceVariant: [type: string, variantType: EntityType];
  batchDelete: [type: string];
  placementVariant: [index: number];
}>();

const showSurface = ref(false);
const surfacePreferenceManual = ref(false);
watch(
  () => props.authoringPanel,
  (panel) => {
    if (!surfacePreferenceManual.value) showSurface.value = panel === "surface";
  },
  { immediate: true },
);
function toggleSurface(): void {
  surfacePreferenceManual.value = true;
  showSurface.value = !showSurface.value;
}
const surfaceCount = computed(() => {
  if (props.model.mode === "cell")
    return props.model.layers.filter((layer) =>
      isSurfaceEntityType(layer.entity.type),
    ).length;
  if (props.model.mode === "multi")
    return props.model.groups
      .filter((group) => isSurfaceEntityType(group.type))
      .reduce((sum, group) => sum + group.count, 0);
  return 0;
});
const visibleModel = computed<InspectorModel>(() => {
  if (showSurface.value || props.model.mode === "none") return props.model;
  if (props.model.mode === "cell") {
    const layers = props.model.layers.filter(
      (layer) => !isSurfaceEntityType(layer.entity.type),
    );
    return {
      ...props.model,
      entityCount: layers.length,
      layers,
    };
  }
  const groups = props.model.groups.filter(
    (group) => !isSurfaceEntityType(group.type),
  );
  return {
    ...props.model,
    entityCount: groups.reduce((sum, group) => sum + group.count, 0),
    groups,
  };
});
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
      v-else-if="visibleModel.mode === 'none'"
      class="editor-inspector-section editor-empty-selection"
    >
      <strong>选择工具</strong>
      <span class="editor-muted">点选一个格子，或拖动框选多个格子。</span>
    </section>
    <EditorCellInspector
      v-else-if="visibleModel.mode === 'cell'"
      :model="visibleModel"
      :show-surface="showSurface"
      :surface-count="surfaceCount"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @toggle-surface="toggleSurface"
      @field="(entityIndex, key, value) => emit('field', entityIndex, key, value)"
      @variant="(entityIndex, index) => emit('variant', entityIndex, index)"
      @surface-variant="(entityIndex, type) => emit('surfaceVariant', entityIndex, type)"
      @delete="emit('deleteLayer', $event)"
      @reorder="emit('reorder', $event)"
    />
    <EditorMultiInspector
      v-else
      :model="visibleModel"
      :show-surface="showSurface"
      :surface-count="surfaceCount"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @toggle-surface="toggleSurface"
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
