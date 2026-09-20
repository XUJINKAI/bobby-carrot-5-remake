<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  decodeExchangeText,
  detectExchangeFormat,
  encodeExchangeText,
} from "@bobby/exchange";
import {
  localizedText,
  resolveWebText,
  webT,
  type WebDisplayText,
} from "../../i18n/webI18n.js";
import { WEB_ERROR_CODES, WebError } from "../../errors/errorCodes.js";
import { errorDisplayText } from "../../errors/errorPresentation.js";
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
const compressed = computed(() => format.value === "payload");
const controls = computed(() => [
  ...props.toolbar.left,
  ...props.toolbar.right,
]);
const importTextControl = computed(() =>
  controls.value.find((control) => control.type === "importText"),
);
const importFileControl = computed(() =>
  controls.value.find((control) => control.type === "importFile"),
);
const statusControl = computed(() =>
  controls.value.find((control) => control.type === "status"),
);
const compressControl = computed(() =>
  controls.value.find((control) => control.type === "compress"),
);
const downloadControl = computed(() =>
  controls.value.find((control) => control.type === "download"),
);
const copyControl = computed(() =>
  controls.value.find((control) => control.type === "copy"),
);
const feedbackText = computed(() =>
  feedback.value === null ? "" : resolveWebText(feedback.value),
);
const acceptedFiles = computed(() =>
  importFileControl.value?.type === "importFile"
    ? importFileControl.value.accept ?? DEFAULT_EXCHANGE_ACCEPT
    : DEFAULT_EXCHANGE_ACCEPT,
);
const payloadSize = computed(() => formatBytes(new Blob([draft.value]).size));
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
    draft.value = decoded.format === "payload"
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
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`;
}

function label(control: DataExchangeControlConfig): string {
  if (control.type === "importText") return control.label ?? webT("common.import");
  if (control.type === "importFile") return control.label ?? webT("common.importFile");
  if (control.type === "compress") return control.label ?? webT("common.compress");
  if (control.type === "copy") return control.label ?? webT("common.copy");
  if (control.type === "download") return control.label ?? webT("common.exportFile");
  return "";
}

onBeforeUnmount(() => {
  if (liveValueTimer !== null) clearTimeout(liveValueTimer);
  refreshVersion++;
});
</script>

<template>
  <section class="data-exchange-panel">
    <div v-if="compressControl || statusControl || $slots.metaAction" class="data-exchange-meta">
      <label
        v-if="compressControl"
        class="data-exchange-check data-exchange-compress-toggle"
        data-exchange-compression
      >
        <input type="checkbox" :checked="compressed" :disabled="busy" @change="toggleCompression">
        <span>{{ label(compressControl) }}</span>
        <span v-if="statusControl" aria-hidden="true">·</span>
        <span v-if="statusControl" class="data-exchange-status">{{ payloadSize }}</span>
      </label>
      <span v-else-if="statusControl" class="data-exchange-status">{{ payloadSize }}</span>
      <slot name="metaAction" />
    </div>
    <textarea
      v-model="draft"
      class="data-exchange-text"
      :placeholder="placeholder"
      spellcheck="false"
      wrap="soft"
      @focus="selectDraft"
      @input="onDraftInput"
    />
    <div class="data-exchange-actions">
      <div class="data-exchange-action-group">
        <button
          v-if="importTextControl"
          class="data-exchange-primary"
          data-exchange-action="importText"
          type="button"
          :disabled="busy"
          @click="importDraft"
        >{{ label(importTextControl) }}</button>
        <button
          v-if="importFileControl"
          data-exchange-action="importFile"
          type="button"
          :disabled="busy"
          @click="fileInput?.click()"
        >{{ label(importFileControl) }}</button>
      </div>
      <div class="data-exchange-action-group data-exchange-actions-right">
        <button
          v-if="downloadControl"
          data-exchange-action="download"
          type="button"
          @click="downloadDraft"
        >{{ label(downloadControl) }}</button>
        <button
          v-if="copyControl"
          class="data-exchange-primary"
          data-exchange-action="copy"
          type="button"
          @click="copyDraft"
        >{{ label(copyControl) }}</button>
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
  background: var(
    --data-exchange-text-bg,
    color-mix(in srgb, var(--bc-bg) 82%, #000 18%)
  );
  color: var(--bc-text);
  font: 0.78rem/1.45 ui-monospace, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.data-exchange-meta,
.data-exchange-actions,
.data-exchange-action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.data-exchange-meta {
  color: var(--muted);
  font-size: 0.75rem;
}

.data-exchange-actions-right {
  margin-left: auto;
}

.data-exchange-actions button {
  min-height: 32px;
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: var(--bc-control-radius);
  background: var(--data-exchange-action-bg, var(--bc-control));
  color: var(--bc-text);
}

.data-exchange-actions button:hover {
  background: var(--data-exchange-action-hover-bg, var(--bc-control-hover));
}

.data-exchange-actions button.data-exchange-primary {
  background: var(--bc-active);
  color: var(--bc-text);
}

.data-exchange-actions button.data-exchange-primary:hover {
  background: color-mix(in srgb, var(--bc-active) 84%, #fff 16%);
}

.data-exchange-feedback {
  color: var(--muted);
  font-size: 0.75rem;
}

.data-exchange-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.data-exchange-check input {
  margin: 0;
  accent-color: var(--bc-active);
}

.data-exchange-compress-toggle {
  cursor: pointer;
}

.data-exchange-compress-toggle:has(input:disabled) {
  cursor: default;
}

.data-exchange-feedback {
  margin: 0;
  min-height: 1em;
}
</style>
