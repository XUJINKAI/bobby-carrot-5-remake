<script setup lang="ts">
import type { AdventureLevelRow } from "./types.js";
import AdventureFrame from "./AdventureFrame.vue";

defineProps<{
  chapterNumber: number;
  title: string;
  description: string;
  stars: string;
  rows: AdventureLevelRow[];
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <AdventureFrame>
    <header class="adventure-toolbar">
      <a
        href="/adventure/chapters"
        @click.prevent="emit('navigate', '/adventure/chapters')"
      >←</a>
      <strong>CHAPTER {{ chapterNumber }}</strong>
      <span class="chapter-stars">{{ stars }}</span>
    </header>
    <section class="adventure-chapter-title">
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </section>
    <main class="adventure-scroll">
      <div class="adventure-level-list">
        <template v-for="row in rows" :key="row.id">
          <a
            v-if="row.unlocked"
            class="adventure-level-row"
            :class="{ completed: row.completed, bonus: row.bonus }"
            :href="'/adventure/play/' + row.id"
            @click.prevent="emit('navigate', '/adventure/play/' + row.id)"
          >
            <span>{{ row.label }}</span>
            <strong>{{ row.id.toUpperCase() }}</strong>
            <span>{{ row.completed ? "✓" : "▶" }}</span>
          </a>
          <div v-else class="adventure-level-row locked" aria-disabled="true">
            <span>{{ row.label }}</span>
            <strong>{{ row.id.toUpperCase() }}</strong>
            <span>🔒</span>
          </div>
        </template>
      </div>
    </main>
  </AdventureFrame>
</template>
