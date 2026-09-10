<script setup lang="ts">
import {
  completedAdventureLevelCount,
  type AdventureSave,
} from "@bobby/adventure";
import { computed, nextTick, ref } from "vue";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";
import { publicBaseUrl } from "../../services/assets/gameAssets.js";
import {
  loadAdventureSave,
  parseAdventureProfileExchange,
  saveAdventureSave,
  serializeAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import type { ExploreCollectionStorage } from "../../storage/contracts.js";
import {
  loadExploreCollectionSave,
  parseExploreCollectionExchange,
  saveExploreCollectionSave,
  serializeExploreCollectionSave,
} from "../../storage/exploreProgressStorage.js";
import {
  listSaveManagementTargets,
  type SaveManagementTarget,
} from "./saveManagementRecords.js";

type SaveManagementTab = SaveManagementTarget & {
  save: AdventureSave | ExploreCollectionStorage;
  feedback: string;
};

const saveTabs = ref<SaveManagementTab[]>(
  listSaveManagementTargets().map((target) => ({
    ...target,
    save: target.kind === "adventure"
      ? loadAdventureSave()
      : loadExploreCollectionSave(target.collection),
    feedback: "",
  })),
);
const activeTabId = ref(saveTabs.value[0]?.id ?? "");
const tabList = ref<HTMLElement | null>(null);
const activeTab = computed(
  () => saveTabs.value.find((tab) => tab.id === activeTabId.value) ?? null,
);

const toolbar = {
  left: [
    { type: "importText" as const, label: "导入" },
    { type: "importFile" as const, label: "导入文件" },
  ],
  right: [
    { type: "status" as const },
    { type: "compress" as const, label: "压缩" },
    { type: "copy" as const, label: "复制" },
    { type: "download" as const, label: "下载" },
  ],
};

function parseSelected(value: unknown): AdventureSave | ExploreCollectionStorage {
  const tab = requireActiveTab();
  return tab.kind === "adventure"
    ? parseAdventureProfileExchange(value)
    : parseExploreCollectionExchange(value);
}

function serializeSelected(value: unknown): string {
  const tab = requireActiveTab();
  return tab.kind === "adventure"
    ? serializeAdventureSave(value as AdventureSave)
    : serializeExploreCollectionSave(value as ExploreCollectionStorage);
}

function importSelected(value: unknown): void {
  const tab = requireActiveTab();
  if (tab.kind === "adventure") {
    tab.save = saveAdventureSave(value as AdventureSave);
    tab.feedback = "Adventure 存档已导入。";
    return;
  }
  tab.save = saveExploreCollectionSave(
    tab.collection,
    value as ExploreCollectionStorage,
  );
  tab.feedback = `${tab.label} 存档已导入。`;
}

function summary(tab: SaveManagementTab): string {
  if (tab.kind === "adventure") {
    const save = tab.save as AdventureSave;
    return [
      `${completedAdventureLevelCount(save)} 已完成`,
      `${save.economy.bonusCoins} Bonus Coin`,
      `${save.economy.goldenCarrots} Golden Carrot`,
    ].join(" · ");
  }
  const save = tab.save as ExploreCollectionStorage;
  return `${save.completedMaps.length} 已完成${
    save.lastMap ? ` · 最近 ${save.lastMap}` : ""
  }`;
}

function description(tab: SaveManagementTab): string {
  return tab.kind === "adventure"
    ? "Campaign 进度、Bonus Coin 和 Golden Carrot。"
    : `${tab.collection} 地图集合的完成记录和最近游玩位置。`;
}

function importNote(tab: SaveManagementTab): string {
  return tab.kind === "adventure"
    ? "导入会覆盖当前 Adventure 存档。"
    : `导入会覆盖 ${tab.collection} 地图集合的 Explore 存档。`;
}

function placeholder(tab: SaveManagementTab): string {
  return tab.kind === "adventure"
    ? "粘贴 Adventure Save JSON、BC5R 文本或分享链接……"
    : "粘贴 Explore Collection Save JSON、BC5R 文本或分享链接……";
}

function exportFilename(tab: SaveManagementTab): string {
  const kind = tab.kind === "adventure"
    ? "adventure"
    : `explore-${safeFilenamePart(tab.collection)}`;
  return `bc5r-${kind}-save-${new Date().toISOString().slice(0, 10)}`;
}

function safeFilenamePart(value: string): string {
  return value
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "collection";
}

function selectRelativeTab(currentId: string, offset: number): void {
  const currentIndex = saveTabs.value.findIndex((tab) => tab.id === currentId);
  const nextIndex = (currentIndex + offset + saveTabs.value.length)
    % saveTabs.value.length;
  activeTabId.value = saveTabs.value[nextIndex]!.id;
  void nextTick(() => {
    tabList.value
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  });
}

function requireActiveTab(): SaveManagementTab {
  if (!activeTab.value) throw new Error("当前没有可管理的存档");
  return activeTab.value;
}
</script>

<template>
  <section class="settings-page">
    <header class="settings-page-header">
      <div>
        <p class="settings-page-eyebrow">SETTINGS</p>
        <h1>存档管理</h1>
      </div>
      <p>导入、复制或下载此浏览器中已有的游戏存档。</p>
    </header>

    <div v-if="saveTabs.length > 0" class="save-management">
      <nav
        ref="tabList"
        class="save-management-tabs"
        role="tablist"
        aria-label="游戏存档"
      >
        <button
          v-for="tab in saveTabs"
          :id="`save-tab-${tab.id}`"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-controls="`save-panel-${tab.id}`"
          :aria-selected="activeTabId === tab.id"
          :tabindex="activeTabId === tab.id ? 0 : -1"
          @click="activeTabId = tab.id"
          @keydown.left.prevent="selectRelativeTab(tab.id, -1)"
          @keydown.right.prevent="selectRelativeTab(tab.id, 1)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <article
        v-if="activeTab"
        :id="`save-panel-${activeTab.id}`"
        class="save-management-card"
        role="tabpanel"
        :aria-labelledby="`save-tab-${activeTab.id}`"
      >
        <header>
          <div>
            <h2>{{ activeTab.label }}</h2>
            <p>{{ description(activeTab) }}</p>
          </div>
          <span class="save-summary">{{ summary(activeTab) }}</span>
        </header>
        <DataExchangePanel
          :value="activeTab.save"
          :serialize="serializeSelected"
          :parse="parseSelected"
          :public-base-url="publicBaseUrl()"
          :filename="exportFilename(activeTab)"
          :placeholder="placeholder(activeTab)"
          :toolbar="toolbar"
          :reset-key="activeTab.id"
          @import="importSelected"
          @error="activeTab.feedback = $event.message"
        />
        <p class="save-management-note">{{ importNote(activeTab) }}</p>
        <p class="save-management-feedback" aria-live="polite">
          {{ activeTab.feedback }}
        </p>
      </article>
    </div>

    <div v-else class="save-management-empty">
      <h2>暂无游戏存档</h2>
      <p>游玩 Adventure 或 Explore 后，对应存档会显示在这里。</p>
    </div>
  </section>
</template>

<style scoped>
.settings-page {
  display: grid;
  gap: 28px;
  color: var(--bc-text);
}

.settings-page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--bc-panel-border);
}

.settings-page-header h1,
.settings-page-header p,
.save-management-card h2,
.save-management-card p,
.save-management-empty h2,
.save-management-empty p {
  margin: 0;
}

.settings-page-header > p {
  max-width: 520px;
  color: var(--bc-text-muted);
  text-align: right;
}

.settings-page-eyebrow {
  margin-bottom: 6px !important;
  color: var(--bc-active);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.save-management {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.save-management-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 0;
}

.save-management-tabs button {
  min-height: 42px;
  flex: 0 0 auto;
  padding: 8px 14px;
  border: 1px solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-control);
  color: var(--bc-text);
  font-weight: 700;
}

.save-management-tabs button[aria-selected="true"] {
  background: var(--bc-control-selected);
  color: var(--bc-control-selected-text);
}

.save-management-card,
.save-management-empty {
  min-width: 0;
  display: grid;
  gap: 14px;
  padding: 18px;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-panel-radius);
  background: var(--bc-panel);
  box-shadow: var(--bc-panel-shadow);
}

.save-management-card > header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
}

.save-management-card header p,
.save-summary,
.save-management-note,
.save-management-feedback,
.save-management-empty p {
  color: var(--bc-text-muted);
  font-size: 0.78rem;
}

.save-summary {
  text-align: right;
}

.save-management-note {
  padding-top: 4px;
  border-top: 1px solid var(--bc-panel-border);
}

.save-management-feedback {
  min-height: 1.1em;
}

.save-management-card :deep(.data-exchange-text) {
  min-height: 360px;
}

@media (max-width: 760px) {
  .settings-page-header,
  .save-management-card > header {
    align-items: start;
    flex-direction: column;
  }

  .settings-page-header > p,
  .save-summary {
    text-align: left;
  }

  .save-management-card :deep(.data-exchange-text) {
    min-height: 280px;
  }
}
</style>
