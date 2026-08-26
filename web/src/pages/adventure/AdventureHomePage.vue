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
        href="/explore"
        @click.prevent="emit('navigate', '/explore')"
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

<style scoped>
.adventure-title {
  padding: clamp(28px, 7vh, 72px) 28px 20px;
  text-align: center;
}

.adventure-title h1 {
  font-size: clamp(2rem, 7vw, 3.4rem);
  margin: 0.2em 0;
}

.adventure-title p {
  line-height: 1.55;
  color: #aebbb1;
}

.adventure-menu {
  display: grid;
  gap: 12px;
  padding: 12px 26px;
}

.adventure-menu a,
.adventure-menu button {
  text-align: center;
  text-decoration: none;
}

.adventure-wallet {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.72rem;
  text-align: center;
}

.adventure-wallet span {
  display: grid;
  gap: 3px;
  padding: 12px 4px;
  background: #111d16;
}

.adventure-wallet strong {
  font-size: 1.1rem;
}
</style>
