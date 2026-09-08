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
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: 8px;
  background: rgb(12 41 83 / 88%);
  color: inherit;
  text-decoration: none;
}

.adventure-chapter:hover {
  background: rgb(18 57 108 / 94%);
}

.adventure-chapter-no {
  color: #91aacb;
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
