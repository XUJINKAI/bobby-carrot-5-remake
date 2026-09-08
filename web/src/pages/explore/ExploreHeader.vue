<script setup lang="ts">
import { explorePlayPath } from "../../app/routes.js";
import AppIcon from "../../shared/icons/AppIcon.vue";
defineProps<{
  collection: string;
  title: string;
  description: string;
  mapCount: number;
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
      <div class="eyebrow">EXPLORE MODE</div>
      <div class="collection-title-line">
        <h1>{{ title }}</h1>
        <span class="level-browser-count">{{ mapCount }} 关</span>
      </div>
      <p>{{ description }}</p>
    </div>
    <div class="level-browser-actions">
      <button id="random-level" class="ghost-btn" @click="emit('random')">
        <AppIcon name="shuffle" />
        随机关卡
      </button>
      <button class="primary-btn" @click="emit('navigate', explorePlayPath({ collection, id: lastMapId }))">
        <AppIcon name="play" weight="fill" />
        继续游玩 · {{ lastMapLabel }}
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
  margin: 0;
}

.collection-title-line {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.section-title h1 {
  margin: 0;
  font-size: 2rem;
}

.section-title p {
  margin: 0;
  color: var(--muted);
}

.level-browser-count {
  color: var(--bc-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0.72;
  white-space: nowrap;
}

.level-browser-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.level-browser-actions button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

@media (max-width: 700px) {
  .level-browser-head {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
