<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type {
  BC5RGlobal,
  BC5RHandle,
  BC5RMount,
  BC5RMountOptions,
  EmbedKeyboardMode,
  EmbedJoystickMode,
  EmbedMusicStyle,
} from "@bobby/embed";
import { EMBED_RUNTIME_CATALOGS, normalizeLocale } from "@bobby/i18n";
import {
  getWebLocale,
  resolveWebText,
  webT,
  type WebDisplayText,
} from "../../i18n/webI18n.js";
import { WEB_ERROR_CODES, WebError } from "../../errors/errorCodes.js";
import { errorDisplayText } from "../../errors/errorPresentation.js";
import {
  generateEmbedCode,
  parseEmbedCode,
} from "./embedCode.js";

const props = defineProps<{ publicBaseUrl: string }>();

type EmbedMount = BC5RMount;

const mapMode = ref<"map" | "mapUrl">("map");
const map = ref(location.hash.slice(1));
const mapUrl = ref("");
const lang = ref(getWebLocale());
const audioEnabled = ref(true);
const audioVolumePercent = ref(100);
const musicStyle = ref<EmbedMusicStyle>("modern");
const keyboard = ref<EmbedKeyboardMode>("focus");
const joystick = ref<EmbedJoystickMode>("auto");
const pointer = ref(true);
const zoom = ref(1);
const minZoom = ref(0.5);
const maxZoom = ref(3);
const pinchZoom = ref(true);
const wheelZoom = ref(false);
const hudTimer = ref(false);
const hudSteps = ref(false);
const info = ref("");
const preview = ref<HTMLElement | null>(null);
const previewError = ref<WebDisplayText | null>(null);
const copyError = ref<WebDisplayText | null>(null);
const embedCode = ref("");
const previewReady = ref(false);
const apiReady = ref(false);
let embedMount: EmbedMount | null = null;
let handle: BC5RHandle | null = null;
let renderSerial = 0;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
const PREVIEW_DEBOUNCE_MS = 200;

const generatedConfig = computed<BC5RMountOptions>(() => ({
  target: "#bc5r",
  ...(mapMode.value === "map" ? { map: map.value.trim() } : { mapUrl: mapUrl.value.trim() }),
  lang: lang.value,
  audio: audioEnabled.value ? audioVolumePercent.value / 100 : false,
  musicStyle: musicStyle.value,
  input: {
    keyboard: keyboard.value,
    joystick: joystick.value,
    pointer: pointer.value,
  },
  camera: {
    zoom: zoom.value,
    minZoom: minZoom.value,
    maxZoom: maxZoom.value,
    pinchZoom: pinchZoom.value,
    wheelZoom: wheelZoom.value,
  },
  hud: {
    timer: hudTimer.value,
    steps: hudSteps.value,
  },
  ...(info.value.trim() ? { info: info.value.trim() } : {}),
}));

const infoPlaceholder = computed(() => {
  const locale = normalizeLocale(lang.value) ?? "zh-CN";
  return EMBED_RUNTIME_CATALOGS[locale]["embedRuntime.movementHint"];
});

watch(
  generatedConfig,
  (config) => {
    embedCode.value = generateEmbedCode(config, standaloneUrl());
  },
  { deep: true, immediate: true },
);
watch(
  embedCode,
  () => {
    copyError.value = null;
    schedulePreviewRefresh();
  },
);

onMounted(async () => {
  try {
    embedMount = await resolveEmbedMount();
    apiReady.value = true;
    await refreshPreview();
  } catch (error) {
    previewError.value = errorDisplayText(error);
  }
});

async function refreshPreview(): Promise<void> {
  const target = preview.value;
  if (!target || !embedMount) return;
  let options: ReturnType<typeof parseEmbedCode>;
  try {
    options = parseEmbedCode(embedCode.value);
  } catch (cause) {
    previewError.value = errorDisplayText(
      new WebError(WEB_ERROR_CODES.embed.invalidCode, { cause }),
    );
    return;
  }
  const serial = ++renderSerial;
  handle?.destroy();
  handle = null;
  previewError.value = null;
  previewReady.value = false;
  try {
    const next = embedMount({ ...options, target });
    handle = next;
    await next.ready;
    if (serial !== renderSerial) {
      next.destroy();
      return;
    }
    previewReady.value = true;
  } catch {
    // Embed runtime 在预览框内显示地图加载错误。
  }
}

function schedulePreviewRefresh(): void {
  if (previewTimer !== null) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    previewTimer = null;
    void refreshPreview();
  }, PREVIEW_DEBOUNCE_MS);
}

async function resolveEmbedMount(): Promise<EmbedMount> {
  if (import.meta.env.DEV) return (await import("@bobby/embed")).mount;
  const existing = globalBc5r()?.mount;
  if (existing) return existing;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = standaloneUrl();
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () =>
        reject(
          new WebError(WEB_ERROR_CODES.embed.runtimeLoadFailed, {
            params: { url: script.src },
          }),
        ),
      { once: true },
    );
    document.head.append(script);
  });
  const loaded = globalBc5r()?.mount;
  if (!loaded)
    throw new WebError(WEB_ERROR_CODES.embed.runtimeUnavailable);
  return loaded;
}

function globalBc5r(): Partial<BC5RGlobal> | undefined {
  return (window as Window & { BC5R?: Partial<BC5RGlobal> }).BC5R;
}

function standaloneUrl(): string {
  return new URL("embed/v1/bc5r.js", props.publicBaseUrl).href;
}

async function copyCode(): Promise<void> {
  copyError.value = null;
  try {
    await navigator.clipboard.writeText(embedCode.value);
  } catch (cause) {
    copyError.value = errorDisplayText(
      new WebError(WEB_ERROR_CODES.common.clipboardUnavailable, { cause }),
    );
  }
}

onBeforeUnmount(() => {
  if (previewTimer !== null) clearTimeout(previewTimer);
  renderSerial++;
  handle?.destroy();
});
</script>

<template>
  <main
    class="embed-page"
    :data-embed-api="apiReady ? 'ready' : 'loading'"
    :data-preview-state="previewReady ? 'ready' : 'idle'"
  >
    <header class="embed-heading">
      <div>
        <p class="eyebrow">BC5R Embed v1</p>
        <h1>{{ webT("embed.title") }}</h1>
        <p>{{ webT("embed.description") }}</p>
      </div>
    </header>

    <div class="embed-layout">
      <section class="embed-config">
        <div class="field-group">
          <div class="segmented">
            <button :class="{ active: mapMode === 'map' }" @click="mapMode = 'map'">{{ webT("embed.mapData") }}</button>
            <button :class="{ active: mapMode === 'mapUrl' }" @click="mapMode = 'mapUrl'">{{ webT("embed.mapUrl") }}</button>
          </div>
          <textarea v-if="mapMode === 'map'" v-model="map" rows="5" wrap="soft" :placeholder="webT('embed.mapDataPlaceholder')"></textarea>
          <input v-else v-model="mapUrl" type="url" placeholder="https://example.com/map.txt" />
        </div>

        <fieldset class="config-group">
          <legend>{{ webT("embed.general") }}</legend>
          <label>{{ webT("embed.language") }}
            <select v-model="lang">
              <option value="zh-CN">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label class="field-group">{{ webT("embed.customInfo") }}<input v-model="info" class="info-input" :placeholder="infoPlaceholder" /></label>
        </fieldset>

        <fieldset class="config-group">
          <legend>{{ webT("embed.sound") }}</legend>
          <label class="check-line"><input v-model="audioEnabled" type="checkbox" /> {{ webT("embed.sound") }}</label>
          <label class="range-field">
            <span>{{ webT("embed.volume") }} <strong>{{ audioVolumePercent }}%</strong></span>
            <input v-model.number="audioVolumePercent" type="range" min="0" max="300" step="1" :disabled="!audioEnabled" />
          </label>
          <div class="choice-row">
            <span>{{ webT("embed.musicStyle") }}</span>
            <div class="choice-toggle" role="radiogroup" :aria-label="webT('embed.musicStyle')">
              <button
                type="button"
                role="radio"
                :aria-checked="musicStyle === 'modern'"
                :class="{ selected: musicStyle === 'modern' }"
                @click="musicStyle = 'modern'"
              >Modern</button>
              <button
                type="button"
                role="radio"
                :aria-checked="musicStyle === '8bit'"
                :class="{ selected: musicStyle === '8bit' }"
                @click="musicStyle = '8bit'"
              >8bit</button>
            </div>
          </div>
        </fieldset>

        <fieldset class="config-group">
          <legend>{{ webT("embed.controls") }}</legend>
          <div class="settings-grid">
            <label>{{ webT("embed.keyboard") }}
              <select v-model="keyboard" class="keyboard-select">
                <option value="focus">Focus</option>
                <option value="global">Global</option>
              </select>
            </label>
            <label>{{ webT("embed.joystick") }}
              <select v-model="joystick">
                <option value="auto">Auto</option>
                <option :value="true">{{ webT("embed.show") }}</option>
                <option :value="false">{{ webT("embed.hide") }}</option>
              </select>
            </label>
          </div>
          <label class="check-line"><input v-model="pointer" type="checkbox" /> {{ webT("embed.pointer") }}</label>
        </fieldset>

        <fieldset class="config-group">
          <legend>{{ webT("embed.hud") }}</legend>
          <div class="checks">
            <label><input v-model="hudTimer" class="hud-timer" type="checkbox" /> {{ webT("embed.timer") }}</label>
            <label><input v-model="hudSteps" class="hud-steps" type="checkbox" /> {{ webT("embed.steps") }}</label>
          </div>
        </fieldset>

        <fieldset class="config-group">
          <legend>{{ webT("embed.camera") }}</legend>
          <div class="settings-grid">
            <label>{{ webT("embed.initialZoom") }}<input v-model.number="zoom" type="number" min="0.1" step="0.1" /></label>
            <label>{{ webT("embed.minZoom") }}<input v-model.number="minZoom" type="number" min="0.1" step="0.1" /></label>
            <label>{{ webT("embed.maxZoom") }}<input v-model.number="maxZoom" type="number" min="0.1" step="0.1" /></label>
          </div>
          <div class="checks">
            <label><input v-model="pinchZoom" type="checkbox" /> {{ webT("embed.pinchZoom") }}</label>
            <label><input v-model="wheelZoom" type="checkbox" /> {{ webT("embed.wheelZoom") }}</label>
          </div>
        </fieldset>
      </section>

      <section class="embed-output">
        <h2>{{ webT("embed.preview") }}</h2>
        <div ref="preview" class="preview"></div>
        <p v-if="previewError" class="error">{{ resolveWebText(previewError) }}</p>

        <div class="code-heading">
          <h2>{{ webT("embed.code") }}</h2>
          <button @click="copyCode">{{ webT("embed.copy") }}</button>
        </div>
        <textarea
          v-model="embedCode"
          class="code-block"
          spellcheck="false"
          wrap="soft"
          :aria-label="webT('embed.code')"
        ></textarea>
        <p v-if="copyError" class="error" aria-live="polite">{{ resolveWebText(copyError) }}</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.embed-page { max-width: 1320px; margin: 0 auto; padding: 32px 24px 56px; color: var(--bc-text); }
.embed-heading h1 { margin: 4px 0 8px; font-size: clamp(28px, 4vw, 44px); }
.embed-heading p { margin: 0; color: var(--muted); }
.eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--bc-highlight); }
.embed-layout { display: grid; grid-template-columns: minmax(300px, 420px) minmax(0, 1fr); gap: 28px; margin-top: 28px; }
.embed-config, .embed-output { min-width: 0; padding: 20px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); }
.field-group { display: grid; gap: 8px; margin: 0 0 18px; }
.config-group { display: grid; gap: 14px; margin: 0 0 18px; padding: 16px; border: 1px solid var(--line); border-radius: 9px; }
.config-group legend { padding: 0 6px; font-weight: 800; color: var(--bc-highlight); }
textarea, input, select { box-sizing: border-box; width: 100%; padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel2); color: var(--bc-text); }
textarea::placeholder, input::placeholder { color: var(--muted); opacity: .75; }
input:disabled { opacity: .55; }
textarea { resize: vertical; font: 12px/1.5 ui-monospace, monospace; overflow-x: hidden; overflow-wrap: anywhere; word-break: break-all; white-space: pre-wrap; }
input[type="range"] { padding: 0; accent-color: var(--bc-active); }
.segmented { display: flex; gap: 8px; }
.segmented button, .code-heading button { padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel2); color: var(--bc-text); cursor: pointer; }
.segmented button.active { background: var(--bc-active); border-color: var(--bc-active); }
.choice-row { display: grid; gap: 6px; font-size: 13px; }
.choice-toggle { display: flex; overflow: hidden; border: 1px solid var(--line); border-radius: 8px; background: var(--panel2); }
.choice-toggle button { min-height: 36px; flex: 1 1 0; padding: 7px 10px; border: 0; border-right: 1px solid var(--line); background: transparent; color: var(--bc-text); cursor: pointer; }
.choice-toggle button:last-child { border-right: 0; }
.choice-toggle button:hover { background: color-mix(in srgb, var(--bc-active) 24%, transparent); }
.choice-toggle button.selected { background: var(--bc-active); }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.settings-grid label, .config-group > label:not(.check-line) { display: grid; gap: 6px; font-size: 13px; }
.checks { display: flex; flex-wrap: wrap; gap: 18px; }
.checks label, .check-line { display: flex; align-items: center; gap: 6px; }
.checks input, .check-line input { width: auto; }
.range-field span { display: flex; justify-content: space-between; gap: 12px; }
.preview { width: 100%; height: 520px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: #061632; box-shadow: 0 8px 24px rgba(0,0,0,.16); }
.error { color: #ffb4ab; }
.code-heading { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; }
.code-block { min-height: 360px; overflow-x: hidden; overflow-y: auto; padding: 16px; border: 1px solid var(--line); border-radius: 10px; background: #061632; color: var(--bc-text); font: 12px/1.55 ui-monospace, monospace; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-all; cursor: text; }
@media (max-width: 900px) { .embed-layout { grid-template-columns: 1fr; } .settings-grid { grid-template-columns: 1fr; } }
</style>
