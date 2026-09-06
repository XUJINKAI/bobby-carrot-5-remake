<script setup lang="ts">
import { parseEditorLevel, serializeEditorLevel, type EditorMap } from "@bobby/editor";
import { computed, reactive, watch } from "vue";
import { publicBaseUrl } from "../../services/assets/gameAssets.js";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";
import { encodeBc5rV1 } from "../../shared/data-exchange/dataExchangeCodec.js";

const props = defineProps<{ open: boolean; level: Readonly<EditorMap> }>();
const emit = defineEmits<{
  close: [];
  import: [level: EditorMap];
  saved: [metadata: { name: string; author?: string }];
}>();
const metadata = reactive({ name: "", author: "" });
watch(
  () => [props.open, props.level],
  () => {
    metadata.name = props.level.meta.name;
    metadata.author = props.level.meta.author ?? "";
  },
  { immediate: true },
);
const exchangeLevel = computed<EditorMap>(() => ({
  ...props.level,
  meta: {
    name: metadata.name,
    ...(metadata.author ? { author: metadata.author } : {}),
  },
}));
const embedUrl = computed(() => new URL("embed", publicBaseUrl()).href);
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

function parseMap(value: unknown): EditorMap {
  return parseEditorLevel(JSON.stringify(value));
}

function serializeMap(value: unknown): string {
  return serializeEditorLevel(value as EditorMap);
}

async function openEmbed(): Promise<void> {
  const url = new URL(embedUrl.value);
  url.hash = await encodeBc5rV1(serializeMap(exchangeLevel.value));
  window.location.assign(url.href);
}

function metadataValue(): { name: string; author?: string } {
  return {
    name: metadata.name,
    ...(metadata.author ? { author: metadata.author } : {}),
  };
}
</script>

<template>
  <div v-if="open" class="editor-dialog-layer" role="presentation" @click.self="emit('close')">
    <section class="editor-dialog" role="dialog" aria-modal="true" aria-label="地图文件">
      <header><strong>地图文件</strong><button class="editor-mini-btn" type="button" @click="emit('close')">×</button></header>
      <label class="editor-field"><span>名称</span><input v-model="metadata.name" maxlength="120"></label>
      <label class="editor-field"><span>作者</span><input v-model="metadata.author" maxlength="80" placeholder="可选"></label>
      <p class="editor-muted">地图内容使用语义 JSON，可通过文本、分享链接、`.json` 或 `.bc5r` 文件交换。</p>
      <p class="editor-muted"><a :href="embedUrl" @click.prevent="openEmbed">内嵌到其他网页</a></p>
      <DataExchangePanel
        :value="exchangeLevel"
        :serialize="serializeMap"
        :parse="parseMap"
        :public-base-url="publicBaseUrl()"
        :filename="metadata.name || 'bc5r-map'"
        :toolbar="toolbar"
        :reset-key="open ? `${level.meta.name}:${level.width}:${level.height}` : 'closed'"
        @import="emit('import', $event as EditorMap)"
        @downloaded="emit('saved', metadataValue())"
      />
    </section>
  </div>
</template>
