<script setup lang="ts">
import type { EditorLevel } from "@bobby/editor";
import { reactive, watch } from "vue";

const props = defineProps<{ open: boolean; level: Readonly<EditorLevel> }>();
const emit = defineEmits<{
  close: [];
  import: [file: File];
  export: [metadata: { name: string; author?: string; description?: string }];
}>();
const metadata = reactive({ name: "", author: "", description: "" });
watch(
  () => [props.open, props.level],
  () => {
    metadata.name = props.level.name;
    metadata.author = props.level.author ?? "";
    metadata.description = props.level.description ?? "";
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="open" class="editor-dialog-layer" role="presentation" @click.self="emit('close')">
    <section class="editor-dialog" role="dialog" aria-modal="true" aria-label="地图文件">
      <header><strong>地图文件</strong><button class="editor-mini-btn" type="button" @click="emit('close')">×</button></header>
      <label class="editor-field"><span>名称</span><input v-model="metadata.name" maxlength="120"></label>
      <label class="editor-field"><span>作者</span><input v-model="metadata.author" maxlength="80" placeholder="可选"></label>
      <label class="editor-field"><span>描述</span><textarea v-model="metadata.description" maxlength="500" rows="3" placeholder="可选" /></label>
      <p class="editor-muted">用户地图使用语义 JSON，包含地图信息、Terrain、Object 与对象实例属性。</p>
      <div class="editor-dialog-actions">
        <label class="editor-btn editor-file-button">导入 JSON<input type="file" accept="application/json,.json" @change="($event.target as HTMLInputElement).files?.[0] && emit('import', ($event.target as HTMLInputElement).files![0]!)"></label>
        <button class="editor-btn editor-primary" type="button" @click="emit('export', { name: metadata.name, ...(metadata.author ? { author: metadata.author } : {}), ...(metadata.description ? { description: metadata.description } : {}) })">导出 JSON</button>
      </div>
    </section>
  </div>
</template>
