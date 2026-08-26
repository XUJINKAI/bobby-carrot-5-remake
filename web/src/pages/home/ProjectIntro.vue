<script setup lang="ts">
defineProps<{ lastLevelId: string }>();
const emit = defineEmits<{ random: [] }>();
</script>

<template>
  <section class="home-about" aria-labelledby="home-about-title">
    <header>
      <span class="eyebrow">ABOUT THE PROJECT</span>
      <h2 id="home-about-title">从原作到现代 Web 游戏</h2>
    </header>
    <div class="home-about-grid">
      <article>
        <h3>原作重制</h3>
        <p>保留 Bobby Carrot 5 的地图、机关、美术与 MIDI，并以现代浏览器运行。</p>
      </article>
      <article>
        <h3>可验证研究</h3>
        <p>语义地图与原版 DAT 维持可验证的格式互操作链路，让机制结论能够回到原作验证。</p>
      </article>
      <article>
        <h3>地图编辑器</h3>
        <p>使用语义 JSON 创建和交换自定义地图，并通过同一套 Engine 直接 Play Test。</p>
      </article>
    </div>
    <p class="home-about-note">项目代码与原创文档遵循仓库许可证；原版资产的权利边界以 THIRD_PARTY_ASSETS.md 为准。</p>
    <div class="home-quick-row">
      <span>最近浏览：{{ lastLevelId }}</span>
      <button class="ghost-btn" @click="emit('random')">随机一关</button>
    </div>
  </section>
</template>

<style scoped>
.home-about {
  min-height: 78vh;
  display: grid;
  align-content: center;
  gap: 24px;
  padding: 80px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.home-about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.home-about article {
  padding: 24px;
  border: 4px solid var(--bc-panel-border);
  border-radius: 7px;
  background: var(--bc-panel);
  box-shadow: 8px 8px 0 #001b5b88;
}

.home-about h2 {
  margin: 3px 0 0;
}

.home-about h3 {
  margin: 0 0 10px;
}

.home-about p {
  color: var(--muted);
  line-height: 1.7;
}

.home-about-note {
  margin: 0;
  color: var(--muted);
  font-size: 0.78rem;
}

.home-quick-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

@media (max-width: 760px) {
  .home-about-grid {
    grid-template-columns: 1fr;
  }
}
</style>
