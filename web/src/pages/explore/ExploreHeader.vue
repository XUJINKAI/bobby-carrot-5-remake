<script setup lang="ts">
import { explorePlayPath } from "../../app/routes.js";
defineProps<{
  chapterCount: number;
  levelCount: number;
  lastLevelId: string;
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
        <h1>自由选关</h1>
        <p>原版 1～40 章全部开放。这里用于找关、筛选、研究机关，不受 Adventure 存档限制。</p>
      </div>
      <div class="level-browser-summary muted">
        {{ chapterCount }} 章 · {{ levelCount }} 关
      </div>
    </div>
    <div class="level-browser-actions">
      <button class="primary-btn" @click="emit('navigate', explorePlayPath({ collection: 'original', id: lastLevelId }))">
        继续浏览 · {{ lastLevelId.toUpperCase() }}
      </button>
      <button id="random-level" class="ghost-btn" @click="emit('random')">
        随机一个关卡
      </button>
      <button class="ghost-btn" @click="emit('navigate', '/adventure/chapters')">
        进入冒险模式
      </button>
    </div>
  </section>
</template>
