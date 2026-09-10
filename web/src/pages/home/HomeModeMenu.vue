<script setup lang="ts">
import { ref } from "vue";
import {
  requireImportedJson,
  type ImportedData,
  type ImportedSaveData,
} from "../../services/import/importPipeline.js";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";
import AppIcon from "../../shared/icons/AppIcon.vue";
import ImportSaveConfirmation from "../import/ImportSaveConfirmation.vue";

const emit = defineEmits<{
  navigate: [path: string];
  importData: [data: ImportedData];
}>();
const importOpen = ref(false);
const pendingSave = ref<ImportedSaveData | null>(null);
const toolbar = {
  left: [],
  right: [
    { type: "importText" as const, label: "打开" },
    { type: "importFile" as const, label: "导入文件", accept: "*/*" },
  ],
};

function parseImport(value: unknown): ImportedData {
  return requireImportedJson(value);
}

function serializeImport(value: unknown): string {
  return JSON.stringify((value as ImportedData).value, null, 2);
}

function acceptImport(data: unknown): void {
  const imported = data as ImportedData;
  if (imported.type === "map") {
    closeImport();
    emit("importData", imported);
    return;
  }
  pendingSave.value = imported;
}

function confirmSave(): void {
  const data = pendingSave.value;
  if (!data) return;
  closeImport();
  emit("importData", data);
}

function closeImport(): void {
  pendingSave.value = null;
  importOpen.value = false;
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
        <strong>冒险模式</strong>
        <span>还原原版关卡体验</span>
        <AppIcon name="next" />
      </a>
      <a
        class="home-mode-card"
        href="/explore"
        @click.prevent="emit('navigate', '/explore')"
      >
        <strong>自由探索</strong>
        <span>浏览原版与扩展地图集合</span>
        <AppIcon name="next" />
      </a>
      <a
        class="home-mode-card"
        href="/edit"
        @click.prevent="emit('navigate', '/edit')"
      >
        <strong>地图编辑器</strong>
        <span>创建或编辑已有地图，并分享给他人</span>
        <AppIcon name="next" />
      </a>
      <button
        class="home-mode-card"
        data-home-import
        type="button"
        @click="importOpen ? closeImport() : importOpen = true"
      >
        <strong>导入地图</strong>
        <span>导入自定义地图或存档</span>
        <AppIcon name="place" />
      </button>
    </div>
    <a
      class="home-embed-link"
      href="/embed"
      @click.prevent="emit('navigate', '/embed')"
    >
      <span>将自制地图内嵌到其他网页</span>
      <AppIcon name="next" />
    </a>
    <div
      v-if="importOpen"
      class="home-import-dialog-layer"
      role="presentation"
      @click.self="closeImport"
    >
      <section class="home-import-dialog" role="dialog" aria-modal="true" aria-label="导入数据">
        <header>
          <strong>导入数据</strong>
          <button type="button" aria-label="关闭" @click="closeImport">
            <AppIcon name="close" />
          </button>
        </header>
        <ImportSaveConfirmation
          v-if="pendingSave"
          :data="pendingSave"
          @confirm="confirmSave"
          @cancel="pendingSave = null"
        />
        <DataExchangePanel
          v-else
          class="home-data-exchange"
          :serialize="serializeImport"
          :parse="parseImport"
          placeholder="粘贴 JSON、BC5R1 文本或分享链接……"
          filename="bc5r-data"
          :toolbar="toolbar"
          @import="acceptImport"
        />
      </section>
    </div>
    <slot />
  </nav>
</template>

<style scoped>
.home-mode-panel {
  width: min(100%, 378px);
  margin-inline: auto;
  display: grid;
  gap: 10px;
}

.home-mode-panel > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 6px;
  color: var(--bc-text-muted);
  font-size: 0.78rem;
}

.home-mode-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 9px;
}

.home-mode-card {
  position: relative;
  min-height: 72px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  align-content: center;
  width: 100%;
  padding: 12px 16px;
  border: var(--bc-control-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: color-mix(in srgb, var(--bc-panel) 92%, transparent);
  color: var(--bc-text);
  text-align: left;
  text-decoration: none;
  box-shadow: var(--bc-panel-shadow);
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.home-mode-card:hover {
  transform: translateY(-1px);
  border-color: var(--bc-text-muted);
  background: var(--bc-control-hover);
}

.home-mode-card.primary {
  border-color: var(--bc-highlight);
  background: var(--bc-active);
}

.home-mode-card strong {
  font-size: 0.92rem;
}

.home-mode-card span {
  color: var(--bc-text-muted);
  font-size: 0.71rem;
  line-height: 1.35;
}

.home-mode-card.primary span {
  color: var(--bc-text);
}

.home-mode-card :deep(.app-icon) {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--bc-highlight);
  font-size: 1.15rem;
}

.home-embed-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-self: start;
  margin: 2px 2px 0;
  color: var(--bc-text-muted);
  font-size: 0.76rem;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.home-embed-link:hover {
  color: var(--bc-text);
}

.home-import-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 78%);
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
</style>
