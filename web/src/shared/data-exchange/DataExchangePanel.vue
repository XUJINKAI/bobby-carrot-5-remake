<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  localizedText,
  resolveWebText,
  webT,
  type WebDisplayText,
} from "../../i18n/webI18n.js";
import { WEB_ERROR_CODES, WebError } from "../../errors/errorCodes.js";
import { errorDisplayText } from "../../errors/errorPresentation.js";
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
  parse: (value: unknown) => unknown | Promise<unknown>;
  publicBaseUrl?: string;
  placeholder?: string;
  filename?: string;
  defaultCompressed?: boolean;
  liveValue?: boolean;
  liveValueDelayMs?: number;
  toolbar: DataExchangeToolbar;
  resetKey?: string | number;
}>(), {
  placeholder: "",
  filename: "bc5r-data",
  defaultCompressed: false,
  liveValue: false,
  liveValueDelayMs: 200,
  resetKey: 0,
});
const emit = defineEmits<{
  import: [value: unknown];
  error: [error: Error];
  copied: [];
  downloaded: [];
}>();

const draft = ref("");
const feedback = ref<WebDisplayText | null>(null);
const busy = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const draftDirty = ref(false);
let liveValueTimer: ReturnType<typeof setTimeout> | null = null;
let refreshVersion = 0;
const format = computed(() => detectExchangeFormat(draft.value));
const compressed = computed(() => format.value === "bc5r1");
const feedbackText = computed(() =>
  feedback.value === null ? "" : resolveWebText(feedback.value),
);
const acceptedFiles = computed(() =>
  [...props.toolbar.left, ...props.toolbar.right]
    .filter((control) => control.type === "importFile")
    .map((control) => control.type === "importFile" ? control.accept ?? DEFAULT_EXCHANGE_ACCEPT : "")
    .join(",") || DEFAULT_EXCHANGE_ACCEPT,
);
const status = computed(() => {
  const label = format.value === "json" ? "JSON" : format.value === "bc5r1" ? "BC5R1" : webT("common.unknownFormat");
  return `${label} · ${formatBytes(new Blob([draft.value]).size)}`;
});
const encodeOptions = (): { publicBaseUrl?: string } =>
  props.publicBaseUrl ? { publicBaseUrl: props.publicBaseUrl } : {};

watch(
  () => props.resetKey,
  () => void initializeDraft(),
  { immediate: true },
);
watch(
  () => props.value,
  () => {
    if (!props.liveValue) return;
    if (liveValueTimer !== null) clearTimeout(liveValueTimer);
    liveValueTimer = setTimeout(
      () => void refreshDraft(false),
      props.liveValueDelayMs,
    );
  },
  { deep: true },
);

async function initializeDraft(): Promise<void> {
  if (liveValueTimer !== null) clearTimeout(liveValueTimer);
  liveValueTimer = null;
  await refreshDraft(true, true);
}

async function refreshDraft(
  useDefaultCompression: boolean,
  force = false,
): Promise<void> {
  liveValueTimer = null;
  if (!force && draftDirty.value) {
    feedback.value = localizedText("common.unsyncedChanges");
    return;
  }
  const version = ++refreshVersion;
  feedback.value = null;
  if (props.value === undefined) {
    draft.value = "";
    draftDirty.value = false;
    return;
  }
  const plain = prettyJson(props.serialize(props.value));
  const shouldCompress = useDefaultCompression
    ? props.defaultCompressed
    : compressed.value;
  const next = shouldCompress
    ? await encodeExchangeText(plain, encodeOptions())
    : plain;
  if (version !== refreshVersion) return;
  draft.value = next;
  draftDirty.value = false;
}

async function flushLiveValue(): Promise<void> {
  if (!props.liveValue) return;
  if (liveValueTimer !== null) clearTimeout(liveValueTimer);
  liveValueTimer = null;
  await refreshDraft(false);
}

async function importDraft(): Promise<void> {
  try {
    busy.value = true;
    const decoded = await decodeExchangeText(draft.value);
    const value = await props.parse(decoded.value);
    emit("import", value);
    const plain = prettyJson(props.serialize(value));
    draft.value = decoded.format === "bc5r1"
      ? await encodeExchangeText(plain, encodeOptions())
      : plain;
    draftDirty.value = false;
    feedback.value = localizedText("common.imported");
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
    await flushLiveValue();
    const wasDirty = draftDirty.value;
    const decoded = await decodeExchangeText(draft.value);
    const plain = JSON.stringify(decoded.value, null, 2);
    draft.value = checked
      ? await encodeExchangeText(plain, encodeOptions())
      : plain;
    draftDirty.value = wasDirty;
    feedback.value = null;
  } catch (error) {
    report(error);
  } finally {
    busy.value = false;
  }
}

async function copyDraft(): Promise<void> {
  try {
    await flushLiveValue();
    await navigator.clipboard.writeText(draft.value);
    feedback.value = localizedText("common.copied");
    emit("copied");
  } catch (cause) {
    report(
      new WebError(WEB_ERROR_CODES.common.clipboardUnavailable, {
        cause,
      }),
    );
  }
}

async function downloadDraft(): Promise<void> {
  try {
    await flushLiveValue();
    downloadExchangeText({
      text: draft.value,
      filename: props.filename,
      compressed: compressed.value,
    });
    feedback.value = localizedText("common.downloaded");
    emit("downloaded");
  } catch (error) {
    report(error);
  }
}

function onDraftInput(): void {
  refreshVersion++;
  draftDirty.value = true;
  feedback.value = null;
}

function selectDraft(event: FocusEvent): void {
  (event.currentTarget as HTMLTextAreaElement).select();
}

function report(value: unknown): void {
  const error = value instanceof Error ? value : new Error(String(value));
  feedback.value = errorDisplayText(error);
  emit("error", error);
}

function prettyJson(text: string): string {
  return JSON.stringify(JSON.parse(text), null, 2);
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function label(control: DataExchangeControlConfig): string {
  if (control.type === "importText") return control.label ?? webT("common.importText");
  if (control.type === "importFile") return control.label ?? webT("common.importFile");
  if (control.type === "compress") return control.label ?? webT("common.compress");
  if (control.type === "copy") return control.label ?? webT("common.copy");
  if (control.type === "download") return control.label ?? webT("common.download");
  return "";
}

onBeforeUnmount(() => {
  if (liveValueTimer !== null) clearTimeout(liveValueTimer);
  refreshVersion++;
});
</script>

<template>
  <section class="data-exchange-panel">
    <textarea
      v-model="draft"
      class="data-exchange-text"
      :placeholder="placeholder"
      spellcheck="false"
      wrap="soft"
      @focus="selectDraft"
      @input="onDraftInput"
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
    <p v-if="feedbackText" class="data-exchange-feedback" aria-live="polite">{{ feedbackText }}</p>
  </section>
</template>

<style scoped>
.data-exchange-panel {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.data-exchange-text {
  width: 100%;
  min-height: 150px;
  resize: vertical;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--bc-control-radius);
  background: color-mix(in srgb, var(--bc-bg) 82%, #000 18%);
  color: var(--bc-text);
  font: 0.78rem/1.45 ui-monospace, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.data-exchange-toolbar,
.data-exchange-toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.data-exchange-toolbar-right {
  margin-left: auto;
}

.data-exchange-toolbar button {
  min-height: 32px;
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: var(--bc-control-radius);
  background: var(--bc-control);
  color: var(--bc-text);
}

.data-exchange-toolbar button:hover {
  background: var(--bc-control-hover);
}

.data-exchange-status,
.data-exchange-feedback {
  color: var(--muted);
  font-size: 0.75rem;
}

.data-exchange-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.data-exchange-feedback {
  margin: 0;
  min-height: 1em;
}
</style>
