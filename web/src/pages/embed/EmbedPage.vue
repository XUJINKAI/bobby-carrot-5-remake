<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type {
  BC5RHandle,
  BC5RMountOptions,
  EmbedKeyboardMode,
  EmbedJoystickMode,
  EmbedMusicStyle,
} from "@bobby/embed";

const props = defineProps<{ publicBaseUrl: string }>();

type EmbedMount = (options: BC5RMountOptions) => BC5RHandle;
type BC5RGlobal = { mount?: EmbedMount };

const mapMode = ref<"map" | "mapUrl">("map");
const map = ref(location.hash.slice(1));
const mapUrl = ref("");
const lang = ref("zh-CN");
const theme = ref("retro");
const audioEnabled = ref(true);
const audioVolumePercent = ref(100);
const musicStyle = ref<EmbedMusicStyle>("modern");
const keyboard = ref<EmbedKeyboardMode>("focus");
const joystick = ref<EmbedJoystickMode>("auto");
const zoom = ref(1);
const minZoom = ref(0.5);
const maxZoom = ref(3);
const pinchZoom = ref(true);
const wheelZoom = ref(false);
const info = ref("");
const preview = ref<HTMLElement | null>(null);
const codeBlock = ref<HTMLElement | null>(null);
const previewError = ref("");
const previewReady = ref(false);
const apiReady = ref(false);
let embedMount: EmbedMount | null = null;
let handle: BC5RHandle | null = null;
let renderSerial = 0;

const options = computed(() => ({
  ...(mapMode.value === "map" ? { map: map.value.trim() } : { mapUrl: mapUrl.value.trim() }),
  lang: lang.value,
  theme: theme.value,
  audio: audioEnabled.value ? audioVolumePercent.value / 100 : false,
  musicStyle: musicStyle.value,
  input: {
    keyboard: keyboard.value,
    joystick: joystick.value,
  },
  camera: {
    zoom: zoom.value,
    minZoom: minZoom.value,
    maxZoom: maxZoom.value,
    pinchZoom: pinchZoom.value,
    wheelZoom: wheelZoom.value,
  },
  ...(info.value.trim() ? { info: info.value.trim() } : {}),
}));

const embedCode = computed(() => {
  const config = {
    target: "#bc5r",
    lang: lang.value,
    theme: theme.value,
    audio: audioEnabled.value ? audioVolumePercent.value / 100 : false,
    musicStyle: musicStyle.value,
    input: {
      keyboard: keyboard.value,
      joystick: joystick.value,
    },
    camera: {
      zoom: zoom.value,
      minZoom: minZoom.value,
      maxZoom: maxZoom.value,
      pinchZoom: pinchZoom.value,
      wheelZoom: wheelZoom.value,
    },
    ...(info.value.trim() ? { info: info.value.trim() } : {}),
    ...(mapMode.value === "map"
      ? { map: map.value.trim() }
      : { mapUrl: mapUrl.value.trim() }),
  };
  return `<div id="bc5r" style="width:100%;height:520px"></div>\n<script src="${standaloneUrl()}"><\/script>\n<script>\nBC5R.mount(${JSON.stringify(config, null, 2)});\n<\/script>`;
});

watch(options, () => void refreshPreview(), { deep: true });

onMounted(async () => {
  try {
    embedMount = await resolveEmbedMount();
    apiReady.value = true;
    await refreshPreview();
  } catch (error) {
    previewError.value = error instanceof Error ? error.message : String(error);
  }
});

async function refreshPreview(): Promise<void> {
  const serial = ++renderSerial;
  handle?.destroy();
  handle = null;
  previewError.value = "";
  previewReady.value = false;
  const target = preview.value;
  if (!target || !embedMount) return;
  const source = mapMode.value === "map" ? map.value.trim() : mapUrl.value.trim();
  if (!source) {
    target.replaceChildren();
    return;
  }
  try {
    const next = embedMount({ target, ...options.value });
    handle = next;
    await next.ready;
    if (serial !== renderSerial) {
      next.destroy();
      return;
    }
    previewReady.value = true;
  } catch (error) {
    if (serial === renderSerial)
      previewError.value = error instanceof Error ? error.message : String(error);
  }
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
      () => reject(new Error(`无法加载 ${script.src}`)),
      { once: true },
    );
    document.head.append(script);
  });
  const loaded = globalBc5r()?.mount;
  if (!loaded) throw new Error("bc5r.js 未暴露 BC5R.mount()");
  return loaded;
}

function globalBc5r(): BC5RGlobal | undefined {
  return (window as Window & { BC5R?: BC5RGlobal }).BC5R;
}

function standaloneUrl(): string {
  return new URL("embed/v1/bc5r.js", props.publicBaseUrl).href;
}

async function copyCode(): Promise<void> {
  await navigator.clipboard.writeText(embedCode.value);
}

function selectAllCode(): void {
  const element = codeBlock.value;
  const selection = window.getSelection();
  if (!element || !selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

onBeforeUnmount(() => handle?.destroy());
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
        <h1>内嵌到其他网页</h1>
        <p>粘贴 Editor 分享数据或填写你自己托管的地图链接，调整参数后复制代码。</p>
      </div>
    </header>

    <div class="embed-layout">
      <section class="embed-config">
        <div class="field-group">
          <div class="segmented">
            <button :class="{ active: mapMode === 'map' }" @click="mapMode = 'map'">地图数据</button>
            <button :class="{ active: mapMode === 'mapUrl' }" @click="mapMode = 'mapUrl'">地图链接</button>
          </div>
          <textarea v-if="mapMode === 'map'" v-model="map" rows="5" wrap="soft" placeholder="BC5R1:... 或 https://bc5r.com/import/v1#..."></textarea>
          <input v-else v-model="mapUrl" type="url" placeholder="https://example.com/map.txt" />
        </div>

        <fieldset class="config-group">
          <legend>通用</legend>
          <div class="settings-grid">
            <label>语言
              <select v-model="lang">
                <option value="zh-CN">中文</option>
              </select>
            </label>
            <label>主题
              <select v-model="theme">
                <option value="retro">retro</option>
              </select>
            </label>
          </div>
          <label class="field-group">自定义信息<input v-model="info" placeholder="Powered by Bobby Carrot 5 Remake" /></label>
        </fieldset>

        <fieldset class="config-group">
          <legend>声音</legend>
          <label class="check-line"><input v-model="audioEnabled" type="checkbox" /> 声音</label>
          <label class="range-field">
            <span>音量 <strong>{{ audioVolumePercent }}%</strong></span>
            <input v-model.number="audioVolumePercent" type="range" min="0" max="200" step="1" :disabled="!audioEnabled" />
          </label>
          <label>音乐风格
            <select v-model="musicStyle">
              <option value="modern">modern</option>
              <option value="8bit">8bit</option>
            </select>
          </label>
        </fieldset>

        <fieldset class="config-group">
          <legend>控制</legend>
          <div class="settings-grid">
            <label>键盘
              <select v-model="keyboard">
                <option value="focus">Focus</option>
                <option value="global">Global</option>
                <option :value="false">关闭</option>
              </select>
            </label>
            <label>摇杆
              <select v-model="joystick">
                <option value="auto">Auto</option>
                <option :value="true">显示</option>
                <option :value="false">隐藏</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset class="config-group">
          <legend>镜头</legend>
          <div class="settings-grid">
            <label>初始 Zoom<input v-model.number="zoom" type="number" min="0.1" step="0.1" /></label>
            <label>最小 Zoom<input v-model.number="minZoom" type="number" min="0.1" step="0.1" /></label>
            <label>最大 Zoom<input v-model.number="maxZoom" type="number" min="0.1" step="0.1" /></label>
          </div>
          <div class="checks">
            <label><input v-model="pinchZoom" type="checkbox" /> Pinch 缩放</label>
            <label><input v-model="wheelZoom" type="checkbox" /> 滚轮缩放</label>
          </div>
        </fieldset>
      </section>

      <section class="embed-output">
        <h2>预览</h2>
        <div ref="preview" class="preview"></div>
        <p v-if="previewError" class="error">{{ previewError }}</p>

        <div class="code-heading">
          <h2>代码</h2>
          <button @click="copyCode">复制</button>
        </div>
        <pre ref="codeBlock" class="code-block" @click="selectAllCode"><code>{{ embedCode }}</code></pre>
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
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.settings-grid label, .config-group > label:not(.check-line) { display: grid; gap: 6px; font-size: 13px; }
.checks { display: flex; flex-wrap: wrap; gap: 18px; }
.checks label, .check-line { display: flex; align-items: center; gap: 6px; }
.checks input, .check-line input { width: auto; }
.range-field span { display: flex; justify-content: space-between; gap: 12px; }
.preview { width: 100%; height: 520px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: #061632; box-shadow: 0 8px 24px rgba(0,0,0,.16); }
.error { color: #ffb4ab; }
.code-heading { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; }
.code-block { overflow-x: hidden; overflow-y: auto; padding: 16px; border: 1px solid var(--line); border-radius: 10px; background: #061632; color: var(--bc-text); font: 12px/1.55 ui-monospace, monospace; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-all; cursor: text; }
.code-block code { white-space: inherit; overflow-wrap: inherit; word-break: inherit; }
@media (max-width: 900px) { .embed-layout { grid-template-columns: 1fr; } .settings-grid { grid-template-columns: 1fr; } }
</style>
