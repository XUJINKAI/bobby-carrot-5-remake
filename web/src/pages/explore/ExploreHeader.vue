<script setup lang="ts">
import { explorePlayPath } from "../../app/routes.js";
defineProps<{
  collection: string;
  title: string;
  description: string;
  summary: string;
  lastMapId: string;
  lastMapLabel: string;
}>();
const emit = defineEmits<{
  navigate: [path: string];
  random: [];
}>();
</script>

<template>
  <section class="level-browser-head">
    <div class="section-title">
      <div>
        <div class="eyebrow">EXPLORE MODE</div>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <div class="level-browser-summary muted">
        {{ summary }}
      </div>
    </div>
    <div class="level-browser-actions">
      <button class="primary-btn" @click="emit('navigate', explorePlayPath({ collection, id: lastMapId }))">
        继续游玩 · {{ lastMapLabel }}
      </button>
      <button id="random-level" class="ghost-btn" @click="emit('random')">
        随机关卡
      </button>
    </div>
  </section>
</template>

<style scoped>
.level-browser-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.section-title {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin: 0;
}

.section-title h1 {
  margin: 0;
  font-size: 2rem;
}

.section-title p {
  margin: 0;
  color: var(--muted);
}

.level-browser-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 700px) {
  .level-browser-head {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
