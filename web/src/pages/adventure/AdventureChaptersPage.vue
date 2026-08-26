<script setup lang="ts">
import type { AdventureChapterRow } from "./types.js";
import AdventureFrame from "./AdventureFrame.vue";

defineProps<{ rows: AdventureChapterRow[] }>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <AdventureFrame>
    <header class="adventure-toolbar">
      <a href="/adventure" @click.prevent="emit('navigate', '/adventure')">←</a>
      <strong>CHAPTER SELECT</strong>
      <span />
    </header>
    <main class="adventure-scroll">
      <div class="adventure-chapters">
        <template v-for="row in rows" :key="row.number">
          <a
            v-if="row.unlocked"
            class="adventure-chapter"
            :href="'/adventure/chapter/' + row.number"
            @click.prevent="emit('navigate', '/adventure/chapter/' + row.number)"
          >
            <span class="adventure-chapter-no">
              {{ String(row.number).padStart(2, "0") }}
            </span>
            <span class="adventure-chapter-copy">
              <strong>{{ row.title }}</strong>
              <span class="chapter-stars">{{ row.stars }}</span>
              <small>{{ row.progress }}</small>
            </span>
          </a>
          <div v-else class="adventure-chapter locked" aria-disabled="true">
            <span class="adventure-chapter-no">
              {{ String(row.number).padStart(2, "0") }}
            </span>
            <span class="adventure-chapter-copy">
              <strong>{{ row.title }}</strong>
              <span class="chapter-stars">{{ row.stars }}</span>
              <small>🔒 LOCKED</small>
            </span>
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

.adventure-scroll {
  overflow: auto;
  min-height: 0;
  flex: 1;
  padding: 14px;
}

.adventure-chapters {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.adventure-chapter {
  display: grid;
  grid-template-columns: 64px 1fr;
  align-items: center;
  min-height: 72px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: #132019;
  color: inherit;
  text-decoration: none;
}

.adventure-chapter.locked {
  opacity: 0.42;
  filter: saturate(0.35);
}

.adventure-chapter-no {
  font-size: 1.6rem;
  font-weight: 900;
  text-align: center;
}

.adventure-chapter-copy {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 8px;
  align-items: center;
}

.adventure-chapter-copy small {
  grid-column: 1 / -1;
  color: #8fa095;
}
</style>
