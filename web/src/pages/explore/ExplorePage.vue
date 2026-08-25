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
  lastLevelId: string;
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
      :chapter-count="chapters.length"
      :level-count="levelCount"
      :last-level-id="lastLevelId"
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
    <ExploreCustomCollection
      v-else-if="customCollection"
      :collection="customCollection"
      @navigate="emit('navigate', $event)"
    />
  </div>
</template>
