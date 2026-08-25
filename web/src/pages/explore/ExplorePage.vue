<script setup lang="ts">
import type { CatalogChapter, CatalogLevel } from "../../services/catalog/catalog.js";
import DifficultyLegend from "./DifficultyLegend.vue";
import ExploreChapterCard from "./ExploreChapterCard.vue";
import ExploreHeader from "./ExploreHeader.vue";

defineProps<{
  chapters: CatalogChapter[];
  levelsByChapter: Map<number, CatalogLevel[]>;
  completedIds: Set<string>;
  levelCount: number;
  lastLevelId: string;
}>();
const emit = defineEmits<{
  navigate: [path: string];
  random: [];
}>();
</script>

<template>
  <div class="explore-page">
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
  </div>
</template>
