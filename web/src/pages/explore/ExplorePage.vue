<script setup lang="ts">
import type { CatalogChapter, CatalogLevel } from "../../services/catalog/catalog.js";
import DifficultyLegend from "./DifficultyLegend.vue";
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
      <DifficultyLegend />
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
