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
  return value ? "★".repeat(value) : "";
}
</script>

<template>
  <section class="chapter-card">
    <header class="chapter-head">
      <div class="chapter-title-line">
        <span class="chapter-id">{{ chapter.id }}</span>
        <span class="chapter-separator">·</span>
        <span class="chapter-name">{{ chapter.name }}</span>
        <span
          v-if="chapter.difficulty"
          class="chapter-stars"
          :title="`章节难度 ${chapter.difficulty} 星`"
        >{{ stars(chapter.difficulty) }}</span>
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
  gap: 12px;
  margin-bottom: 12px;
}

.chapter-title-line {
  display: flex;
  align-items: baseline;
  gap: 7px;
  min-width: 0;
  color: var(--accent);
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.chapter-id,
.chapter-separator,
.chapter-stars {
  flex: 0 0 auto;
}

.chapter-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: uppercase;
}

.chapter-stars {
  letter-spacing: 0.04em;
}

.explore-map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 7px;
}

@media (max-width: 700px) {
  .chapter-head {
    align-items: flex-start;
  }

  .chapter-title-line {
    flex-wrap: wrap;
  }

  .explore-map-grid {
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  }
}
</style>
