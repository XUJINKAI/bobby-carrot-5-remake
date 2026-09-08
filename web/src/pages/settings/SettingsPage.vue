<script setup lang="ts">
import {
  completedAdventureLevelCount,
  type AdventureSave,
} from "@bobby/adventure";
import { computed, ref } from "vue";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";
import { publicBaseUrl } from "../../services/assets/gameAssets.js";
import {
  loadAdventureSave,
  parseAdventureProfileExchange,
  saveAdventureSave,
  serializeAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import {
  loadExploreProgressSave,
  parseExploreProgressExchange,
  saveExploreProgressSave,
  serializeExploreProgressSave,
  type ExploreProgressSave,
} from "../../storage/exploreProgressStorage.js";

const adventureSave = ref(loadAdventureSave());
const exploreSave = ref(loadExploreProgressSave());
const adventureFeedback = ref("");
const exploreFeedback = ref("");
const adventureCompletedCount = computed(() =>
  completedAdventureLevelCount(adventureSave.value),
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

const exploreCompletedCount = computed(() =>
  Object.values(exploreSave.value.collections).reduce(
    (total, save) => total + save.completedMaps.length,
    0,
  ),
);
const exploreRecentCollectionCount = computed(
  () =>
    Object.values(exploreSave.value.collections).filter((save) => save.lastMap)
      .length,
);

function parseAdventure(value: unknown): AdventureSave {
  return parseAdventureProfileExchange(value);
}

function serializeAdventure(value: unknown): string {
  return serializeAdventureSave(value as AdventureSave);
}

function importAdventure(value: unknown): void {
  adventureSave.value = saveAdventureSave(value as AdventureSave);
  adventureFeedback.value = "Adventure 存档已导入。";
}

function parseExplore(value: unknown): ExploreProgressSave {
  return parseExploreProgressExchange(value);
}

function serializeExplore(value: unknown): string {
  return serializeExploreProgressSave(value as ExploreProgressSave);
}

function importExplore(value: unknown): void {
  exploreSave.value = saveExploreProgressSave(value as ExploreProgressSave);
  exploreFeedback.value = "Explore 存档已导入。";
}

function exportFilename(kind: "adventure" | "explore"): string {
  return `bc5r-${kind}-save-${new Date().toISOString().slice(0, 10)}`;
}
</script>

<template>
  <section class="settings-page">
    <header class="settings-page-header">
      <div>
        <p class="settings-page-eyebrow">SETTINGS</p>
        <h1>设置管理</h1>
      </div>
      <p>管理需要独立页面承载的长期数据和高级选项。</p>
    </header>

    <div class="settings-layout">
      <nav class="settings-tabs" role="tablist" aria-label="设置分类">
        <button type="button" role="tab" aria-selected="true">存档管理</button>
      </nav>

      <div class="settings-tab-panel" role="tabpanel">
        <article class="save-management-card">
          <header>
            <div>
              <h2>Adventure</h2>
              <p>Campaign 进度、Bonus Coin 和 Golden Carrot。</p>
            </div>
            <span class="save-summary">
              {{ adventureCompletedCount }} 已完成 ·
              {{ adventureSave.economy.bonusCoins }} Bonus Coin ·
              {{ adventureSave.economy.goldenCarrots }} Golden Carrot
            </span>
          </header>
          <DataExchangePanel
            :value="adventureSave"
            :serialize="serializeAdventure"
            :parse="parseAdventure"
            :public-base-url="publicBaseUrl()"
            :filename="exportFilename('adventure')"
            placeholder="粘贴 Adventure Save JSON、BC5R 文本或分享链接……"
            :toolbar="toolbar"
            @import="importAdventure"
            @error="adventureFeedback = $event.message"
          />
          <p class="save-management-note">导入会覆盖当前 Adventure 存档。</p>
          <p class="save-management-feedback" aria-live="polite">{{ adventureFeedback }}</p>
        </article>

        <article class="save-management-card">
          <header>
            <div>
              <h2>Explore</h2>
              <p>各地图集合的完成记录和最近游玩位置。</p>
            </div>
            <span class="save-summary">
              {{ exploreCompletedCount }} 已完成 ·
              {{ exploreRecentCollectionCount }} 个集合有最近记录
            </span>
          </header>
          <DataExchangePanel
            :value="exploreSave"
            :serialize="serializeExplore"
            :parse="parseExplore"
            :public-base-url="publicBaseUrl()"
            :filename="exportFilename('explore')"
            placeholder="粘贴 Explore Save JSON、BC5R 文本或分享链接……"
            :toolbar="toolbar"
            @import="importExplore"
            @error="exploreFeedback = $event.message"
          />
          <p class="save-management-note">导入会覆盖当前 Explore 完成记录和最近游玩位置。</p>
          <p class="save-management-feedback" aria-live="polite">{{ exploreFeedback }}</p>
        </article>
      </div>
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
.save-management-card p {
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

.settings-layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 24px;
}

.settings-tabs {
  align-self: start;
  display: grid;
  gap: 6px;
}

.settings-tabs button {
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-control-selected);
  color: var(--bc-control-selected-text);
  font-weight: 700;
  text-align: left;
}

.settings-tab-panel {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.save-management-card {
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
.save-management-feedback {
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

  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-tabs {
    display: flex;
  }
}
</style>
