<script setup lang="ts">
import type {
  MapCollectionChapter,
  MapCollectionMap,
} from "../../services/catalog/catalog.js";
import ExploreMapCard from "./ExploreMapCard.vue";

defineProps<{
  collectionId: string;
  chapter: MapCollectionChapter;
  maps: MapCollectionMap[];
  completedIds: Set<string>;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();

function stars(value: number | undefined): string {
  if (!value) return "";
  return `${"★".repeat(value)}${"☆".repeat(Math.max(0, 3 - value))}`;
}
</script>

<template>
  <section class="chapter-card">
    <header class="chapter-head">
      <div>
        <div class="chapter-number">
          CHAPTER {{ chapter.id }}
          <span
            v-if="chapter.difficulty"
            class="chapter-stars"
            :title="`章节难度 ${chapter.difficulty} 星`"
          >{{ stars(chapter.difficulty) }}</span>
        </div>
        <h3>{{ chapter.name }}</h3>
      </div>
      <span class="muted chapter-count">{{ maps.length }} 关</span>
    </header>
    <div class="explore-map-grid">
      <ExploreMapCard
        v-for="map in maps"
        :key="map.id"
        :collection-id="collectionId"
        :map="map"
        :completed="completedIds.has(map.id)"
        @navigate="emit('navigate', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.chapter-card {
  border: 3px solid var(--line);
  border-radius: 6px;
  background: var(--panel);
  padding: 16px;
}

.chapter-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chapter-head h3 {
  margin: 3px 0 0;
  font-size: 1.08rem;
}

.chapter-number {
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  color: var(--accent);
  font-weight: 800;
}

.explore-map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 7px;
}

@media (max-width: 700px) {
  .explore-map-grid {
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  }
}
</style>
