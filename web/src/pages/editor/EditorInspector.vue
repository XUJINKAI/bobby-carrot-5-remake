<script setup lang="ts">
import {
  isSurfaceEntityType,
  type EditorDefinition,
  type EntityCatalog,
  type InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import { computed, ref } from "vue";
import EditorCellInspector from "./EditorCellInspector.vue";
import EditorMultiInspector from "./EditorMultiInspector.vue";

const props = defineProps<{
  model: InspectorModel;
  images: ImageManager;
  catalog: EntityCatalog;
  editor: EditorDefinition;
}>();
const emit = defineEmits<{
  property: [entityIndex: number, key: string, value: string];
  state: [entityIndex: number, key: string, value: string];
  variant: [entityIndex: number, index: number];
  deleteLayer: [entityIndex: number];
  reorder: [refsTopToBottom: number[]];
  batchProperty: [type: string, key: string, value: string];
  batchState: [type: string, key: string, value: string];
  batchVariant: [type: string, index: number];
  batchDelete: [type: string];
}>();

const showSurface = ref(false);
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
</script>

<template>
  <aside class="editor-inspector">
    <div class="editor-panel-title">Inspector</div>
    <section
      v-if="visibleModel.mode === 'none'"
      class="editor-inspector-section editor-muted"
    >
      使用选择工具点选一个格子，或拖动框选多个格子。
    </section>
    <EditorCellInspector
      v-else-if="visibleModel.mode === 'cell'"
      :model="visibleModel"
      :show-surface="showSurface"
      :surface-count="surfaceCount"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @toggle-surface="showSurface = !showSurface"
      @property="(entityIndex, key, value) => emit('property', entityIndex, key, value)"
      @state="(entityIndex, key, value) => emit('state', entityIndex, key, value)"
      @variant="(entityIndex, index) => emit('variant', entityIndex, index)"
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
      @toggle-surface="showSurface = !showSurface"
      @property="(type, key, value) => emit('batchProperty', type, key, value)"
      @state="(type, key, value) => emit('batchState', type, key, value)"
      @variant="(type, index) => emit('batchVariant', type, index)"
      @delete-type="emit('batchDelete', $event)"
    />
  </aside>
</template>
