<script setup lang="ts">
import type { AdventureLevelRow } from "./types.js";
import AdventureViewport from "./AdventureViewport.vue";

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
  <AdventureViewport>
    <section class="adventure-chapter-title">
      <div>
        <span>{{ String(chapterNumber).padStart(2, "0") }}</span>
        <h2>{{ title }}</h2>
        <span class="chapter-stars">{{ stars }}</span>
      </div>
      <p v-if="description">{{ description }}</p>
    </section>
    <main class="adventure-scroll">
      <div class="adventure-level-list">
        <template v-for="row in rows" :key="row.id">
          <a
            v-if="row.unlocked"
            class="adventure-level-row"
            :class="{ completed: row.completed }"
            :href="'/adventure/play/' + row.id"
            @click.prevent="emit('navigate', '/adventure/play/' + row.id)"
          >
            <span class="level-status">{{ row.completed ? "✓" : "▶" }}</span>
            <strong>{{ row.id.toUpperCase() }}</strong>
          </a>
          <div v-else class="adventure-level-row locked" aria-disabled="true">
            <span class="level-status">🔒</span>
            <strong>{{ row.id.toUpperCase() }}</strong>
          </div>
        </template>
      </div>
    </main>
  </AdventureViewport>
</template>

<style scoped>
.adventure-chapter-title {
  flex: 0 0 auto;
  padding: 20px 20px 12px;
  background: #143678;
  color: #f4f7ff;
}

.adventure-chapter-title > div {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.adventure-chapter-title h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.08rem;
}

.adventure-chapter-title > div > span:first-child {
  color: #8fa9ca;
  font-weight: 900;
}

.adventure-chapter-title p {
  margin: 9px 0 0;
  color: #a8b9ce;
  font-size: 0.77rem;
  line-height: 1.45;
}

.adventure-scroll {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 8px 14px 22px;
  background: #143678;
  color: #f4f7ff;
}

.adventure-level-list {
  display: grid;
  gap: 7px;
}

.adventure-level-row {
  min-height: 52px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 8px;
  background: rgb(10 35 73 / 88%);
  color: inherit;
  text-decoration: none;
}

.adventure-level-row.completed {
  opacity: 0.74;
}

.adventure-level-row.locked {
  opacity: 0.36;
}

.level-status {
  text-align: center;
}

.adventure-level-row strong {
  font-size: 0.84rem;
  letter-spacing: 0.04em;
}
</style>
