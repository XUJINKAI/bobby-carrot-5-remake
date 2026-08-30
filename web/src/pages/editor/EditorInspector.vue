<script setup lang="ts">
import type {
  EditorDefinition,
  EntityCatalog,
  InspectorModel,
} from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
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
</script>

<template>
  <aside class="editor-inspector">
    <div class="editor-panel-title">Inspector</div>
    <section
      v-if="model.mode === 'none'"
      class="editor-inspector-section editor-muted"
    >
      使用选择工具点选一个格子，或拖动框选多个格子。
    </section>
    <EditorCellInspector
      v-else-if="model.mode === 'cell'"
      :model="model"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @property="(entityIndex, key, value) => emit('property', entityIndex, key, value)"
      @state="(entityIndex, key, value) => emit('state', entityIndex, key, value)"
      @variant="(entityIndex, index) => emit('variant', entityIndex, index)"
      @delete="emit('deleteLayer', $event)"
      @reorder="emit('reorder', $event)"
    />
    <EditorMultiInspector
      v-else
      :model="model"
      :images="images"
      :catalog="catalog"
      :editor="editor"
      @property="(type, key, value) => emit('batchProperty', type, key, value)"
      @state="(type, key, value) => emit('batchState', type, key, value)"
      @variant="(type, index) => emit('batchVariant', type, index)"
      @delete-type="emit('batchDelete', $event)"
    />
  </aside>
</template>
