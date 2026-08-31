<script setup lang="ts">
import { parseEditorLevel, serializeEditorLevel, type EditorMap } from "@bobby/editor";
import { ref } from "vue";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";

const emit = defineEmits<{
  navigate: [path: string];
  importMap: [level: EditorMap];
}>();
const importOpen = ref(false);
const toolbar = {
  left: [],
  right: [
    { type: "importText" as const, label: "打开" },
    { type: "importFile" as const, label: "导入文件" },
  ],
};

function parseMap(value: unknown): EditorMap {
  return parseEditorLevel(JSON.stringify(value));
}

function serializeMap(value: unknown): string {
  return serializeEditorLevel(value as EditorMap);
}
</script>

<template>
  <nav class="home-mode-panel" aria-label="选择模式">
    <header>
      <span class="eyebrow">PLAY YOUR WAY</span>
      <span>选择模式</span>
    </header>
    <div class="home-mode-grid">
      <a
        class="home-mode-card primary"
        href="/adventure"
        @click.prevent="emit('navigate', '/adventure')"
      >
        <strong>冒险模式</strong><span>按章节推进原版 Campaign</span><b>→</b>
      </a>
      <a
        class="home-mode-card"
        href="/explore"
        @click.prevent="emit('navigate', '/explore')"
      >
        <strong>自由探索</strong><span>浏览原版与扩展地图集合</span><b>→</b>
      </a>
      <a
        class="home-mode-card"
        href="/edit"
        @click.prevent="emit('navigate', '/edit')"
      >
        <strong>地图编辑器</strong><span>创建地图并随时 Play Test</span><b>→</b>
      </a>
      <button
        class="home-mode-card"
        data-home-import
        type="button"
        @click="importOpen = !importOpen"
      >
        <strong>导入地图</strong><span>打开 JSON、BC5R 文本或分享链接</span><b>＋</b>
      </button>
    </div>
    <div
      v-if="importOpen"
      class="home-import-dialog-layer"
      role="presentation"
      @click.self="importOpen = false"
    >
      <section class="home-import-dialog" role="dialog" aria-modal="true" aria-label="导入自定义地图">
        <header>
          <strong>导入自定义地图</strong>
          <button type="button" aria-label="关闭" @click="importOpen = false">×</button>
        </header>
        <DataExchangePanel
          class="home-data-exchange"
          :serialize="serializeMap"
          :parse="parseMap"
          placeholder="粘贴地图 JSON、BC5R 文本或分享链接……"
          filename="bc5r-map"
          :toolbar="toolbar"
          @import="emit('importMap', $event as EditorMap)"
        />
      </section>
    </div>
    <slot />
  </nav>
</template>

<style scoped>
.home-mode-panel {
  display: grid;
  gap: 10px;
}

.home-mode-panel > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 6px;
  color: #d8e2f1;
  font-size: 0.78rem;
}

.home-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.home-mode-card {
  position: relative;
  min-height: 82px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  align-content: center;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 12px;
  background: #172231;
  color: #f5f8ff;
  text-align: left;
  text-decoration: none;
  box-shadow: 0 8px 24px rgb(0 15 52 / 18%);
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.home-mode-card:hover {
  transform: translateY(-1px);
  border-color: rgb(255 255 255 / 28%);
  background: #1d2b3d;
}

.home-mode-card.primary {
  border-color: #60b8ad;
  background: #20786f;
}

.home-mode-card strong {
  font-size: 0.92rem;
}

.home-mode-card span {
  color: #aebdd1;
  font-size: 0.71rem;
  line-height: 1.35;
}

.home-mode-card.primary span {
  color: #d6eeea;
}

.home-mode-card b {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: #e8edf1;
  font-size: 1.15rem;
}

.home-import-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(2 5 12 / 78%);
}

.home-import-dialog {
  width: min(660px, 100%);
  padding: 18px;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-panel-radius);
  background: var(--bc-panel);
  box-shadow: var(--bc-panel-shadow);
}

.home-import-dialog > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.home-import-dialog > header button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.4rem;
}

@media (max-width: 520px) {
  .home-mode-grid {
    grid-template-columns: 1fr;
  }
}
</style>
