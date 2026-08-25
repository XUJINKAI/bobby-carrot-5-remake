<script setup lang="ts">
import type { AdventureHomeView } from "./types.js";
import AdventureFrame from "./AdventureFrame.vue";

defineProps<{ view: AdventureHomeView }>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <AdventureFrame>
    <header class="adventure-title">
      <div class="eyebrow">ORIGINAL ADVENTURE</div>
      <h1>Bobby Carrot 5 Remake</h1>
      <p>按原版章节顺序游玩；存档、全局道具、一次性奖励和受限竖屏视野只属于这里。</p>
    </header>
    <nav class="adventure-menu">
      <a
        class="primary-btn"
        :href="view.nextLevelId ? '/adventure/play/' + view.nextLevelId : '/adventure/chapters'"
        @click.prevent="emit('navigate', view.nextLevelId ? '/adventure/play/' + view.nextLevelId : '/adventure/chapters')"
      >
        {{ view.nextLevelId ? "继续 · " + view.nextLevelId.toUpperCase() : "选择章节" }}
      </a>
      <a
        class="ghost-btn"
        href="/adventure/chapters"
        @click.prevent="emit('navigate', '/adventure/chapters')"
      >章节选择</a>
      <a
        class="ghost-btn"
        href="/levels"
        @click.prevent="emit('navigate', '/levels')"
      >自由探索模式</a>
      <button class="ghost-btn" type="button" data-action="settings">存档 / 设置</button>
    </nav>
    <section class="adventure-wallet">
      <span>BONUS <strong>{{ view.bonusCoins }}</strong></span>
      <span>GOLDEN CARROT <strong>{{ view.goldenCarrots }}</strong></span>
      <span>KEY <strong>{{ view.goldenKey ? "★" : "—" }}</strong></span>
    </section>
  </AdventureFrame>
</template>
