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
