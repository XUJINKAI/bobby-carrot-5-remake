<script setup lang="ts">
import { parseEditorLevel, serializeEditorLevel, type EditorMap } from "@bobby/editor";
import { computed } from "vue";
import { publicBaseUrl } from "../../services/assets/gameAssets.js";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";
import { encodeExchangePayload } from "@bobby/exchange";
import AppIcon from "../../shared/icons/AppIcon.vue";
import { webT } from "../../i18n/webI18n.js";
import { createBackdropDismissHandlers } from "../../shared/dialog/backdropDismiss.js";
import type { EditorMetadataField } from "./useEditorPage.js";

const props = defineProps<{
  open: boolean;
  level: Readonly<EditorMap>;
  nameValue: string;
  authorValue: string;
  noteValue: string;
}>();
const emit = defineEmits<{
  close: [];
  import: [level: EditorMap];
  metadataField: [field: EditorMetadataField, value: string];
  metadataFlush: [];
  saved: [];
}>();
const exchangeLevel = computed<EditorMap>(() => ({
  ...props.level,
  meta: {
    ...props.level.meta,
    name: props.nameValue,
    author: props.authorValue,
    note: props.noteValue,
  },
}));
const embedUrl = computed(() => new URL("embed", publicBaseUrl()).href);
const toolbar = computed(() => ({
  left: [
    { type: "importText" as const, label: webT("editor.applyMapText") },
    { type: "importFile" as const },
  ],
  right: [
    { type: "status" as const },
    { type: "compress" as const },
    { type: "copy" as const },
    { type: "download" as const },
  ],
}));

function parseMap(value: unknown): EditorMap {
  return parseEditorLevel(JSON.stringify(value));
}

function serializeMap(value: unknown): string {
  return serializeEditorLevel(value as EditorMap);
}

async function openEmbed(): Promise<void> {
  emit("metadataFlush");
  const url = new URL(embedUrl.value);
  url.hash = await encodeExchangePayload(serializeMap(exchangeLevel.value));
  window.location.assign(url.href);
}

function close(): void {
  emit("metadataFlush");
  emit("close");
}

const backdropDismiss = createBackdropDismissHandlers(close);

function downloaded(): void {
  emit("metadataFlush");
  emit("saved");
}

function imported(level: EditorMap): void {
  emit("import", level);
}

function textValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}
</script>

<template>
  <div
    v-if="open"
    class="editor-dialog-layer"
    role="presentation"
    @pointerdown="backdropDismiss.pointerDown"
    @pointerup="backdropDismiss.pointerUp"
    @pointercancel="backdropDismiss.pointerCancel"
  >
    <section class="editor-dialog" role="dialog" aria-modal="true" :aria-label="webT('editor.mapFile')">
      <header>
        <strong>{{ webT("editor.mapFile") }}</strong>
        <button class="editor-mini-btn" data-editor-dialog-close type="button" :aria-label="webT('common.close')" @click="close">
          <AppIcon name="close" />
        </button>
      </header>
      <label class="editor-field"><span>{{ webT("editor.mapName") }}</span><input :value="nameValue" data-editor-share-metadata="name" maxlength="120" @input="emit('metadataField', 'name', textValue($event))"></label>
      <label class="editor-field"><span>{{ webT("editor.mapAuthor") }}</span><input :value="authorValue" data-editor-share-metadata="author" maxlength="80" :placeholder="webT('editor.optional')" @input="emit('metadataField', 'author', textValue($event))"></label>
      <label class="editor-field"><span>{{ webT("editor.mapNote") }}</span><textarea :value="noteValue" data-editor-share-metadata="note" maxlength="500" rows="4" :placeholder="webT('editor.optional')" @input="emit('metadataField', 'note', textValue($event))"></textarea></label>
      <p class="editor-muted">{{ webT("editor.shareDescription") }}</p>
      <p class="editor-muted"><a :href="embedUrl" @click.prevent="openEmbed">{{ webT("editor.openEmbed") }}</a></p>
      <DataExchangePanel
        :value="exchangeLevel"
        :serialize="serializeMap"
        :parse="parseMap"
        :public-base-url="publicBaseUrl()"
        :filename="nameValue || 'bc5r-map'"
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
