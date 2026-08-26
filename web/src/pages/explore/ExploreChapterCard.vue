<script setup lang="ts">
import type {
  MapCollectionChapter,
  MapCollectionMap,
} from "../../services/catalog/catalog.js";
import { explorePlayPath } from "../../app/routes.js";

defineProps<{
  collectionId: string;
  chapter: MapCollectionChapter;
  maps: MapCollectionMap[];
  completedIds: Set<string>;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();

function displayShort(map: MapCollectionMap): string {
  const bonus = /-bonus-([12])$/.exec(map.id);
  if (bonus) return `BONUS ${bonus[1]}`;
  return map.id.split("-").at(-1)?.toUpperCase() ?? map.id.toUpperCase();
}

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
    <div class="chapter-levels">
      <a
        v-for="map in maps"
        :key="map.id"
        class="chapter-level"
        :data-map-id="map.id"
        :class="{
          completed: completedIds.has(map.id),
          'bonus-level': map.kind === 'bonus',
        }"
        :href="explorePlayPath({ collection: collectionId, id: map.id })"
        :title="map.name"
        @click.prevent="emit('navigate', explorePlayPath({ collection: collectionId, id: map.id }))"
      >
        <span class="chapter-level-no">{{ displayShort(map) }}</span>
        <span
          v-if="completedIds.has(map.id)"
          class="done-mark"
          title="自由浏览中已通关"
        >✓</span>
      </a>
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

.chapter-levels {
  display: grid;
  grid-template-columns: repeat(12, minmax(56px, 1fr));
  gap: 7px;
}

.chapter-level {
  position: relative;
  min-height: 68px;
  border: 2px solid var(--bc-panel-border);
  border-radius: 4px;
  background: #064b8c;
  color: inherit;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  transition:
    transform 0.12s ease,
    border-color 0.12s ease,
    background 0.12s ease;
}

.chapter-level:hover {
  transform: translateY(-2px);
  border-color: var(--bc-panel-border);
  background: var(--bc-active);
}

.chapter-level.completed {
  border-color: var(--bc-highlight);
  background: #07518f;
}

.chapter-level.bonus-level {
  outline: 1px solid rgba(247, 212, 95, 0.2);
}

.chapter-level-no {
  font-size: 1.05rem;
  font-weight: 750;
}

.done-mark {
  position: absolute;
  right: 6px;
  top: 4px;
  color: var(--bc-highlight);
  font-size: 0.72rem;
}

@media (max-width: 1080px) {
  .chapter-levels {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 700px) {
  .chapter-levels {
    grid-template-columns: repeat(4, 1fr);
  }

  .chapter-level {
    min-height: 62px;
  }
}
</style>
