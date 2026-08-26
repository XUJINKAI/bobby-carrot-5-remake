<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  decodeExchangeText,
  detectExchangeFormat,
  encodeExchangeText,
} from "./dataExchangeCodec.js";
import {
  DEFAULT_EXCHANGE_ACCEPT,
  downloadExchangeText,
  readExchangeFile,
} from "./dataExchangeFile.js";
import type {
  DataExchangeControlConfig,
  DataExchangeToolbar,
} from "./dataExchangeTypes.js";

const props = withDefaults(defineProps<{
  value?: unknown;
  serialize: (value: unknown) => string;
  parse: (value: unknown) => unknown;
  publicBaseUrl?: string;
  placeholder?: string;
  filename?: string;
  defaultCompressed?: boolean;
  toolbar: DataExchangeToolbar;
  resetKey?: string | number;
}>(), {
  placeholder: "",
  filename: "bc5r-data",
  defaultCompressed: false,
  resetKey: 0,
});
const emit = defineEmits<{
  import: [value: unknown];
  error: [error: Error];
  copied: [];
  downloaded: [];
}>();

const draft = ref("");
const feedback = ref("");
const busy = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const format = computed(() => detectExchangeFormat(draft.value));
const compressed = computed(() => format.value === "bc5r1");
const acceptedFiles = computed(() =>
  [...props.toolbar.left, ...props.toolbar.right]
    .filter((control) => control.type === "importFile")
    .map((control) => control.type === "importFile" ? control.accept ?? DEFAULT_EXCHANGE_ACCEPT : "")
    .join(",") || DEFAULT_EXCHANGE_ACCEPT,
);
const status = computed(() => {
  const label = format.value === "json" ? "JSON" : format.value === "bc5r1" ? "BC5R1" : "未知格式";
  return `${label} · ${formatBytes(new Blob([draft.value]).size)}`;
});
const encodeOptions = (): { publicBaseUrl?: string } =>
  props.publicBaseUrl ? { publicBaseUrl: props.publicBaseUrl } : {};

watch(
  () => props.resetKey,
  () => void initializeDraft(),
  { immediate: true },
);

async function initializeDraft(): Promise<void> {
  if (props.value === undefined) {
    draft.value = "";
    return;
  }
  const plain = prettyJson(props.serialize(props.value));
  draft.value = props.defaultCompressed
    ? await encodeExchangeText(plain, encodeOptions())
    : plain;
}

async function importDraft(): Promise<void> {
  try {
    busy.value = true;
    const decoded = await decodeExchangeText(draft.value);
    const value = props.parse(decoded.value);
    emit("import", value);
    const plain = prettyJson(props.serialize(value));
    draft.value = decoded.format === "bc5r1"
      ? await encodeExchangeText(plain, encodeOptions())
      : plain;
    feedback.value = "已导入";
  } catch (error) {
    report(error);
  } finally {
    busy.value = false;
  }
}

async function selectFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    draft.value = await readExchangeFile(file);
    await importDraft();
  } catch (error) {
    report(error);
  }
}

async function toggleCompression(event: Event): Promise<void> {
  const checked = (event.target as HTMLInputElement).checked;
  try {
    busy.value = true;
    const decoded = await decodeExchangeText(draft.value);
    const plain = JSON.stringify(decoded.value, null, 2);
    draft.value = checked
      ? await encodeExchangeText(plain, encodeOptions())
      : plain;
    feedback.value = "";
  } catch (error) {
    report(error);
  } finally {
    busy.value = false;
  }
}

async function copyDraft(): Promise<void> {
  try {
    await navigator.clipboard.writeText(draft.value);
    feedback.value = "已复制";
    emit("copied");
  } catch (cause) {
    report(new Error("无法访问剪贴板", { cause }));
  }
}

function downloadDraft(): void {
  downloadExchangeText({
    text: draft.value,
    filename: props.filename,
    compressed: compressed.value,
  });
  feedback.value = "已下载";
  emit("downloaded");
}

function report(value: unknown): void {
  const error = value instanceof Error ? value : new Error(String(value));
  feedback.value = error.message;
  emit("error", error);
}

function prettyJson(text: string): string {
  return JSON.stringify(JSON.parse(text), null, 2);
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function label(control: DataExchangeControlConfig): string {
  if (control.type === "importText") return control.label ?? "导入文本";
  if (control.type === "importFile") return control.label ?? "导入文件";
  if (control.type === "compress") return control.label ?? "压缩";
  if (control.type === "copy") return control.label ?? "复制";
  if (control.type === "download") return control.label ?? "下载";
  return "";
}
</script>

<template>
  <section class="data-exchange-panel">
    <textarea
      v-model="draft"
      class="data-exchange-text"
      :placeholder="placeholder"
      spellcheck="false"
      @input="feedback = ''"
    />
    <div class="data-exchange-toolbar">
      <div class="data-exchange-toolbar-group">
        <template v-for="(control, index) in toolbar.left" :key="`${control.type}-${index}`">
          <button v-if="control.type === 'importText'" type="button" :disabled="busy" @click="importDraft">{{ label(control) }}</button>
          <button v-else-if="control.type === 'importFile'" type="button" :disabled="busy" @click="fileInput?.click()">{{ label(control) }}</button>
          <span v-else-if="control.type === 'status'" class="data-exchange-status">{{ status }}</span>
          <label v-else-if="control.type === 'compress'" class="data-exchange-check"><input type="checkbox" :checked="compressed" :disabled="busy" @change="toggleCompression">{{ label(control) }}</label>
          <button v-else-if="control.type === 'copy'" type="button" @click="copyDraft">{{ label(control) }}</button>
          <button v-else-if="control.type === 'download'" type="button" @click="downloadDraft">{{ label(control) }}</button>
        </template>
      </div>
      <div class="data-exchange-toolbar-group data-exchange-toolbar-right">
        <template v-for="(control, index) in toolbar.right" :key="`${control.type}-${index}`">
          <button v-if="control.type === 'importText'" type="button" :disabled="busy" @click="importDraft">{{ label(control) }}</button>
          <button v-else-if="control.type === 'importFile'" type="button" :disabled="busy" @click="fileInput?.click()">{{ label(control) }}</button>
          <span v-else-if="control.type === 'status'" class="data-exchange-status">{{ status }}</span>
          <label v-else-if="control.type === 'compress'" class="data-exchange-check"><input type="checkbox" :checked="compressed" :disabled="busy" @change="toggleCompression">{{ label(control) }}</label>
          <button v-else-if="control.type === 'copy'" type="button" @click="copyDraft">{{ label(control) }}</button>
          <button v-else-if="control.type === 'download'" type="button" @click="downloadDraft">{{ label(control) }}</button>
        </template>
      </div>
    </div>
    <input ref="fileInput" type="file" hidden :accept="acceptedFiles" @change="selectFile">
    <p v-if="feedback" class="data-exchange-feedback" aria-live="polite">{{ feedback }}</p>
  </section>
</template>

<style scoped>
.data-exchange-panel { display: grid; gap: 8px; min-width: 0; }
.data-exchange-text { width: 100%; min-height: 150px; resize: vertical; box-sizing: border-box; padding: 10px; border: 1px solid var(--line); border-radius: 6px; background: #071710; color: inherit; font: 0.78rem/1.45 ui-monospace, monospace; }
.data-exchange-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.data-exchange-toolbar-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.data-exchange-toolbar-right { margin-left: auto; }
.data-exchange-toolbar button { min-height: 32px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 6px; background: #173b29; color: inherit; }
.data-exchange-status, .data-exchange-feedback { color: var(--muted); font-size: 0.75rem; }
.data-exchange-check { display: inline-flex; align-items: center; gap: 5px; }
.data-exchange-feedback { margin: 0; min-height: 1em; }
</style>
