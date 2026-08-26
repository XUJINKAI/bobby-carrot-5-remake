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

<style scoped>
.adventure-toolbar {
  height: 56px;
  display: grid;
  grid-template-columns: 52px 1fr 80px;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex: none;
}

.adventure-toolbar a {
  color: inherit;
  text-decoration: none;
  font-size: 1.35rem;
}

.adventure-chapter-title {
  padding: 18px 22px 8px;
  text-align: center;
}

.adventure-chapter-title h2 {
  margin: 0;
}

.adventure-chapter-title p {
  font-size: 0.82rem;
  color: #96a79b;
}

.adventure-scroll {
  overflow: auto;
  min-height: 0;
  flex: 1;
  padding: 14px;
}

.adventure-level-list {
  display: grid;
  gap: 8px;
}

.adventure-level-row {
  display: grid;
  grid-template-columns: 1fr 1fr 28px;
  align-items: center;
  padding: 14px 12px;
  border-radius: 8px;
  background: #14231a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: inherit;
  text-decoration: none;
}

.adventure-level-row.bonus {
  border-color: rgba(247, 212, 95, 0.4);
  background: #292718;
}

.adventure-level-row.completed {
  opacity: 0.78;
}

.adventure-level-row.locked {
  opacity: 0.35;
}

.adventure-level-row strong {
  text-align: center;
}
</style>
