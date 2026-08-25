<script setup lang="ts">
import type { CatalogChapter, CatalogLevel } from "../../services/catalog/catalog.js";
import { explorePlayPath } from "../../app/routes.js";

defineProps<{
  chapter: CatalogChapter;
  levels: CatalogLevel[];
  completedIds: Set<string>;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();

function displayShort(level: CatalogLevel): string {
  return level.bonusOrdinal
    ? `BONUS ${level.bonusOrdinal}`
    : String(level.sourceLevelIndex);
}

function stars(value: number): string {
  return `${"★".repeat(value)}${"☆".repeat(Math.max(0, 3 - value))}`;
}
</script>

<template>
  <section class="chapter-card">
    <header class="chapter-head">
      <div>
        <div class="chapter-number">
          CHAPTER {{ chapter.number }}
          <span
            class="chapter-stars"
            :title="`原版章节难度 ${chapter.difficultyStars} 星`"
          >
            {{ stars(chapter.difficultyStars) }}
          </span>
        </div>
        <h3>{{ chapter.title }}</h3>
      </div>
      <span class="muted chapter-count">{{ levels.length }} 关</span>
    </header>
    <div class="chapter-levels">
      <a
        v-for="level in levels"
        :key="level.publicId"
        class="chapter-level"
        :class="{
          completed: completedIds.has(level.canonicalId),
          'bonus-level': level.contentKind === 'bonus',
        }"
        :href="explorePlayPath({ collection: 'original', id: level.publicId })"
        :title="`${level.publicId} · ${level.difficulty.label}`"
        @click.prevent="emit('navigate', explorePlayPath({ collection: 'original', id: level.publicId }))"
      >
        <span class="chapter-level-no">{{ displayShort(level) }}</span>
        <span
          class="difficulty-badge"
          :class="[level.difficulty.level, level.difficulty.source]"
        >
          {{ level.difficulty.label }}
        </span>
        <span
          v-if="completedIds.has(level.canonicalId)"
          class="done-mark"
          title="自由浏览中已通关"
        >✓</span>
      </a>
    </div>
  </section>
</template>
