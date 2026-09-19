<script setup lang="ts">
import { parseEditorLevel, serializeEditorLevel, type EditorMap } from "@bobby/editor";
import { computed } from "vue";
import { publicBaseUrl } from "../../services/assets/gameAssets.js";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";
import { encodeExchangePayload } from "@bobby/exchange";
import AppIcon from "../../shared/icons/AppIcon.vue";
import {
  metadataValue,
  useEditorMetadataDraft,
} from "./useEditorMetadataDraft.js";

const props = defineProps<{ open: boolean; level: Readonly<EditorMap> }>();
const emit = defineEmits<{
  close: [];
  import: [level: EditorMap];
  metadata: [value: { name: string; author?: string; note?: string }];
  saved: [];
}>();
const { metadata, flushMetadata } = useEditorMetadataDraft({
  source: () => props.level.meta,
  apply: (value) => emit("metadata", value),
  enabled: () => props.open,
});
const exchangeLevel = computed<EditorMap>(() => {
  const level: EditorMap = {
    ...props.level,
    meta: metadataValue(metadata),
  };
  return level;
});
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
  flushMetadata();
  const url = new URL(embedUrl.value);
  url.hash = await encodeExchangePayload(serializeMap(exchangeLevel.value));
  window.location.assign(url.href);
}

function close(): void {
  flushMetadata();
  emit("close");
}

function downloaded(): void {
  flushMetadata();
  emit("saved");
}

function imported(level: EditorMap): void {
  emit("import", level);
}
</script>

<template>
  <div v-if="open" class="editor-dialog-layer" role="presentation" @click.self="close">
    <section class="editor-dialog" role="dialog" aria-modal="true" aria-label="地图文件">
      <header>
        <strong>地图文件</strong>
        <button class="editor-mini-btn" type="button" aria-label="关闭" @click="close">
          <AppIcon name="close" />
        </button>
      </header>
      <label class="editor-field"><span>名称</span><input v-model="metadata.name" data-editor-share-metadata="name" maxlength="120"></label>
      <label class="editor-field"><span>作者</span><input v-model="metadata.author" data-editor-share-metadata="author" maxlength="80" placeholder="可选"></label>
      <label class="editor-field"><span>注记</span><textarea v-model="metadata.note" data-editor-share-metadata="note" maxlength="500" rows="4" placeholder="可选"></textarea></label>
      <p class="editor-muted">地图内容使用语义 JSON，可通过文本、分享链接、`.json` 或 `.bc5r` 文件交换。</p>
      <p class="editor-muted"><a :href="embedUrl" @click.prevent="openEmbed">内嵌到其他网页</a></p>
      <DataExchangePanel
        :value="exchangeLevel"
        :serialize="serializeMap"
        :parse="parseMap"
        :public-base-url="publicBaseUrl()"
        :filename="metadata.name || 'bc5r-map'"
        :default-compressed="true"
        live-value
        :toolbar="toolbar"
        :reset-key="open ? 'open' : 'closed'"
        @import="imported($event as EditorMap)"
        @downloaded="downloaded"
      />
    </section>
  </div>
</template>
