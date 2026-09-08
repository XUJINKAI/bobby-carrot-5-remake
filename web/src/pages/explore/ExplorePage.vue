<script setup lang="ts">
import type {
  MapCollectionMap,
  MapCollectionSummary,
} from "../../services/catalog/catalog.js";
import type { ResolvedMapCollection } from "../../app/pageContracts.js";
import { computed } from "vue";
import ExploreChapterCard from "./ExploreChapterCard.vue";
import ExploreHeader from "./ExploreHeader.vue";
import ExploreCustomCollection from "./ExploreCustomCollection.vue";
import ExploreTabs from "./ExploreTabs.vue";

const props = defineProps<{
  activeCollection: ResolvedMapCollection;
  collections: MapCollectionSummary[];
  mapsByChapter: Map<string, MapCollectionMap[]>;
  completedIds: Set<string>;
  lastMapId: string;
  lastMapLabel: string;
}>();
const emit = defineEmits<{
  navigate: [path: string];
  random: [];
}>();

const unchapteredMaps = computed(() =>
  props.activeCollection.maps.filter((map) => map.chapter === undefined),
);
</script>

<template>
  <div class="explore-page">
    <ExploreTabs
      :active-collection="activeCollection.id"
      :collections="collections"
      @navigate="emit('navigate', $event)"
    />
    <ExploreHeader
      :collection="activeCollection.id"
      :title="activeCollection.name"
      :description="activeCollection.description ?? ''"
      :map-count="activeCollection.maps.length"
      :last-map-id="lastMapId"
      :last-map-label="lastMapLabel"
      @navigate="emit('navigate', $event)"
      @random="emit('random')"
    />
    <div class="collection-sections">
      <ExploreCustomCollection
        v-if="unchapteredMaps.length > 0"
        :collection="activeCollection"
        :maps="unchapteredMaps"
        :completed-ids="completedIds"
        @navigate="emit('navigate', $event)"
      />
      <div v-if="activeCollection.chapters.length > 0" class="chapter-list">
        <ExploreChapterCard
          v-for="chapter in activeCollection.chapters"
          :key="chapter.id"
          :collection-id="activeCollection.id"
          :chapter="chapter"
          :maps="mapsByChapter.get(chapter.id) ?? []"
          :completed-ids="completedIds"
          :card-size="activeCollection.cardSize"
          @navigate="emit('navigate', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-sections,
.chapter-list {
  display: grid;
  gap: 14px;
}
</style>

<style>
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
