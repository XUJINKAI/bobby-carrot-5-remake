<script setup lang="ts">
import type {
  MapCollectionCardSize,
  MapCollectionChapter,
  MapCollectionMap,
} from "../../services/catalog/catalog.js";
import ExploreMapGrid from "./ExploreMapGrid.vue";
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{
  collectionId: string;
  chapter: MapCollectionChapter;
  maps: MapCollectionMap[];
  completedIds: Set<string>;
  cardSize: MapCollectionCardSize;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();

</script>

<template>
  <section class="chapter-card">
    <header class="chapter-head">
      <div class="chapter-title-line">
        <span class="chapter-id">{{ chapter.id }}</span>
        <template v-if="chapter.name !== undefined">
          <span class="chapter-separator">·</span>
          <span class="chapter-name">{{ chapter.name }}</span>
        </template>
      </div>
      <div class="chapter-meta">
        <span
          v-if="chapter.difficulty"
          class="chapter-stars"
          :title="`章节难度 ${chapter.difficulty} 星`"
        >
          <AppIcon
            v-for="star in chapter.difficulty"
            :key="star"
            name="star"
            weight="fill"
          />
        </span>
        <span class="muted chapter-count">{{ maps.length }} 关</span>
      </div>
    </header>
    <ExploreMapGrid
      :collection-id="collectionId"
      :maps="maps"
      :completed-ids="completedIds"
      :card-size="cardSize"
      @navigate="emit('navigate', $event)"
    />
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
}

.chapter-meta {
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  justify-content: flex-end;
  gap: 10px;
}

.chapter-stars {
  display: inline-flex;
  gap: 1px;
  letter-spacing: 0.04em;
  text-align: right;
}

@media (max-width: 700px) {
  .chapter-head {
    align-items: flex-start;
  }

  .chapter-title-line {
    flex-wrap: wrap;
  }

  .chapter-meta {
    display: grid;
    justify-items: end;
    gap: 2px;
  }
}
</style>
