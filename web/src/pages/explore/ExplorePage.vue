<script setup lang="ts">
import type { CatalogChapter, CatalogLevel } from "../../services/catalog/catalog.js";
import ExploreChapterCard from "./ExploreChapterCard.vue";
import ExploreHeader from "./ExploreHeader.vue";
import ExploreCustomCollection from "./ExploreCustomCollection.vue";
import ExploreTabs from "./ExploreTabs.vue";
import type { CustomMapCollection } from "../../services/catalog/catalog.js";

defineProps<{
  chapters: CatalogChapter[];
  levelsByChapter: Map<number, CatalogLevel[]>;
  completedIds: Set<string>;
  levelCount: number;
  lastMapId: string;
  lastMapLabel: string;
  activeCollection: string;
  customCollections: CustomMapCollection[];
  customCollection?: CustomMapCollection;
}>();
const emit = defineEmits<{
  navigate: [path: string];
  random: [];
}>();
</script>

<template>
  <div class="explore-page">
    <ExploreTabs
      :active-collection="activeCollection"
      :collections="customCollections"
      @navigate="emit('navigate', $event)"
    />
    <template v-if="activeCollection === 'original'">
      <ExploreHeader
        collection="original"
        title="自由选关"
        description="原版 1～40 章全部开放。这里用于找关、筛选和研究机关。"
        :summary="`${chapters.length} 章 · ${levelCount} 关`"
        :last-map-id="lastMapId"
        :last-map-label="lastMapLabel"
        @navigate="emit('navigate', $event)"
        @random="emit('random')"
      />
      <div class="chapter-list">
        <ExploreChapterCard
          v-for="chapter in chapters"
          :key="chapter.id"
          :chapter="chapter"
          :levels="levelsByChapter.get(chapter.number) ?? []"
          :completed-ids="completedIds"
          @navigate="emit('navigate', $event)"
        />
      </div>
    </template>
    <template v-else-if="customCollection">
      <ExploreHeader
        :collection="customCollection.id"
        :title="customCollection.name"
        :description="customCollection.description"
        :summary="`${customCollection.maps.length} 张地图`"
        :last-map-id="lastMapId"
        :last-map-label="lastMapLabel"
        @navigate="emit('navigate', $event)"
        @random="emit('random')"
      />
      <ExploreCustomCollection
        :collection="customCollection"
        @navigate="emit('navigate', $event)"
      />
    </template>
  </div>
</template>

<style scoped>
.chapter-list {
  display: grid;
  gap: 14px;
}
</style>

<style>
/* 筛选栏由 levelFilters.ts 在 ExplorePage 挂载后生成，因此需要页面级选择器。 */
.level-filter-shell {
  margin: 0 0 20px;
  border: 3px solid var(--bc-panel-border);
  border-radius: 7px;
  background: var(--bc-panel);
  overflow: hidden;
  box-shadow: 6px 6px 0 #001b5b99;
}

.level-filter-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--bc-panel);
}

.level-filter-label {
  margin-right: 2px;
  color: var(--bc-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.level-filter-spacer {
  flex: 1;
}

.level-filter-trigger,
.level-filter-clear,
.level-filter-option {
  border: 2px solid var(--bc-panel-border);
  border-radius: 5px;
  background: var(--panel2);
  color: var(--bc-text);
  cursor: pointer;
}

.level-filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
}

.level-filter-trigger:hover,
.level-filter-option:hover {
  border-color: var(--bc-highlight);
  background: var(--bc-active);
}

.level-filter-trigger.active,
.level-filter-trigger.open {
  border-color: var(--bc-highlight);
  background: var(--bc-active);
}

.level-filter-count {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--bc-highlight);
  color: var(--bc-panel-border);
  font-size: 0.65rem;
  font-weight: 800;
}

.level-filter-clear {
  padding: 6px 9px;
  color: var(--bc-text-muted);
  background: transparent;
}

.level-filter-clear:hover {
  color: var(--bc-text);
  border-color: var(--bc-highlight);
}

.level-filter-clear[hidden],
.level-filter-panel[hidden] {
  display: none !important;
}

.level-filter-panel {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  padding: 10px 12px 12px;
  border-top: 2px solid var(--bc-panel-border);
  background: var(--panel2);
}

.level-filter-option {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 5px 9px 5px 6px;
  font-size: 0.76rem;
}

.level-filter-option.selected {
  border-color: var(--bc-highlight);
  background: var(--bc-active);
  color: var(--bc-text);
}

.level-filter-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border-radius: 4px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  box-shadow: 0 0 0 1px #ffffff40;
}

.level-filter-option .difficulty-dot {
  width: 10px;
  height: 10px;
  margin: 0 7px;
}

.difficulty-dot.tutorial {
  background: #7296c8;
}

.level-filter-status {
  min-height: 18px;
  padding: 0 12px 9px;
  background: var(--panel2);
  color: var(--bc-text-muted);
  font-size: 0.7rem;
}

.level-filter-empty {
  margin-top: 14px;
  padding: 22px;
  border: 2px dashed var(--bc-panel-border);
  border-radius: 7px;
  background: var(--bc-panel);
  color: var(--bc-text-muted);
  text-align: center;
}

.filter-hidden {
  display: none !important;
}

@media (max-width: 700px) {
  .level-filter-toolbar {
    align-items: stretch;
  }

  .level-filter-label {
    width: 100%;
  }

  .level-filter-spacer {
    display: none;
  }

  .level-filter-trigger {
    flex: 1 1 auto;
    justify-content: center;
  }

  .level-filter-clear {
    margin-left: auto;
  }

  .level-filter-panel {
    max-height: 210px;
    overflow: auto;
  }

  .level-filter-option {
    flex: 1 1 calc(50% - 7px);
    justify-content: flex-start;
  }
}
</style>
