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
