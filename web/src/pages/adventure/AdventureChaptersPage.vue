<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import type { AdventureChapterRow } from "./types.js";
import AdventureViewport from "./AdventureViewport.vue";
import OriginalChapterStatusIcon from "./OriginalChapterStatusIcon.vue";
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{ rows: AdventureChapterRow[]; images: ImageManager }>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <AdventureViewport>
    <main class="adventure-scroll">
      <div class="adventure-chapters">
        <a
          v-for="row in rows"
          :key="row.number"
          class="adventure-chapter"
          :href="'/adventure/chapter/' + row.number"
          @click.prevent="emit('navigate', '/adventure/chapter/' + row.number)"
        >
          <OriginalChapterStatusIcon :images="images" :completed="row.completed" />
          <span class="adventure-chapter-no">{{ String(row.number).padStart(2, "0") }}</span>
          <strong>{{ row.title }}</strong>
          <span class="chapter-stars" :title="`章节难度 ${row.difficulty} 星`">
            <AppIcon
              v-for="star in row.difficulty"
              :key="star"
              name="star"
              weight="fill"
            />
          </span>
        </a>
      </div>
    </main>
  </AdventureViewport>
</template>

<style scoped>
.adventure-scroll {
  height: 100%;
  overflow: auto;
  padding: 14px 12px 24px;
  background: #143678;
  color: #f4f7ff;
}

.adventure-chapters {
  display: grid;
  gap: 7px;
}

.adventure-chapter {
  min-height: 58px;
  display: grid;
  grid-template-columns: 38px 36px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 7px 11px;
  border: var(--bc-control-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: color-mix(in srgb, var(--bc-panel) 92%, transparent);
  color: var(--bc-text);
  text-decoration: none;
  box-shadow: var(--bc-panel-shadow);
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.adventure-chapter:hover {
  transform: translateY(-1px);
  border-color: var(--bc-text-muted);
  background: var(--bc-control-hover);
}

.adventure-chapter-no {
  color: var(--bc-text-muted);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.adventure-chapter strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.86rem;
  letter-spacing: 0.03em;
}

.chapter-stars {
  display: inline-flex;
  gap: 1px;
  font-size: 0.76rem;
}
</style>
