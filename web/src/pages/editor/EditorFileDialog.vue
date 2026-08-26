<script setup lang="ts">
import { parseEditorLevel, serializeEditorLevel, type EditorLevel } from "@bobby/editor";
import { computed, reactive, watch } from "vue";
import { publicBaseUrl } from "../../services/assets/gameAssets.js";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";

const props = defineProps<{ open: boolean; level: Readonly<EditorLevel> }>();
const emit = defineEmits<{
  close: [];
  import: [level: EditorLevel];
  saved: [metadata: { name: string; author?: string; description?: string }];
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
const exchangeLevel = computed<EditorLevel>(() => {
  const level: EditorLevel = { ...props.level, name: metadata.name };
  delete level.author;
  delete level.description;
  if (metadata.author) level.author = metadata.author;
  if (metadata.description) level.description = metadata.description;
  return level;
});
const toolbar = {
  left: [
    { type: "importText" as const, label: "应用" },
    { type: "importFile" as const, label: "导入文件" },
  ],
  right: [
    { type: "status" as const },
    { type: "compress" as const, label: "压缩" },
    { type: "copy" as const, label: "复制" },
    { type: "download" as const, label: "下载" },
  ],
};

function parseMap(value: unknown): EditorLevel {
  return parseEditorLevel(JSON.stringify(value));
}

function serializeMap(value: unknown): string {
  return serializeEditorLevel(value as EditorLevel);
}

function metadataValue(): { name: string; author?: string; description?: string } {
  return {
    name: metadata.name,
    ...(metadata.author ? { author: metadata.author } : {}),
    ...(metadata.description ? { description: metadata.description } : {}),
  };
}
</script>

<template>
  <div v-if="open" class="editor-dialog-layer" role="presentation" @click.self="emit('close')">
    <section class="editor-dialog" role="dialog" aria-modal="true" aria-label="地图文件">
      <header><strong>地图文件</strong><button class="editor-mini-btn" type="button" @click="emit('close')">×</button></header>
      <label class="editor-field"><span>名称</span><input v-model="metadata.name" maxlength="120"></label>
      <label class="editor-field"><span>作者</span><input v-model="metadata.author" maxlength="80" placeholder="可选"></label>
      <label class="editor-field"><span>描述</span><textarea v-model="metadata.description" maxlength="500" rows="3" placeholder="可选" /></label>
      <p class="editor-muted">地图内容使用语义 JSON，可通过文本、分享链接、`.json` 或 `.bc5r` 文件交换。</p>
      <DataExchangePanel
        :value="exchangeLevel"
        :serialize="serializeMap"
        :parse="parseMap"
        :public-base-url="publicBaseUrl()"
        :filename="metadata.name || 'bc5r-map'"
        :toolbar="toolbar"
        :reset-key="open ? `${level.name}:${level.width}:${level.height}` : 'closed'"
        @import="emit('import', $event as EditorLevel)"
        @downloaded="emit('saved', metadataValue())"
      />
    </section>
  </div>
</template>
