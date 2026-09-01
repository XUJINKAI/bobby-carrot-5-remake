<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import NightTrainScene from "../../shared/original-scenes/NightTrainScene.vue";
import EmbedFeaturePreview from "./EmbedFeaturePreview.vue";
import PushboxFeaturePreview from "./PushboxFeaturePreview.vue";

defineProps<{ images: ImageManager }>();
</script>

<template>
  <section class="home-about" aria-labelledby="home-about-title">
    <header class="home-about-heading">
      <span class="eyebrow">BOBBY CARROT 5 REMAKE</span>
      <h2 id="home-about-title">《兔子波比5》重制版</h2>
      <p>从原版关卡、美术与机关出发，把兔子波比 5 重新带到现代 Web。</p>
    </header>

    <article class="feature-story feature-story-train">
      <div class="feature-visual">
        <NightTrainScene :images="images" />
      </div>
      <div class="feature-copy">
        <span>CLASSIC REMAKE</span>
        <h3>复刻经典</h3>
        <p>
          还原原版冒险体验，复刻400个关卡+80个奖励关，海狸商店等机制也悉数还原。
        </p>
      </div>
    </article>

    <article class="feature-story reverse">
      <div class="feature-visual">
        <PushboxFeaturePreview />
      </div>
      <div class="feature-copy">
        <span>MAP EDITOR</span>
        <h3>地图编辑器</h3>
        <p>
          增强的地图编辑器不仅可以创建原版机制的地图，还有很多新的机制提供，例如推箱子和传送门。
        </p>
      </div>
    </article>

    <article class="feature-story">
      <div class="feature-visual">
        <EmbedFeaturePreview />
      </div>
      <div class="feature-copy">
        <span>SHARE &amp; EMBED</span>
        <h3>尽情分享</h3>
        <p>
          提供多种分享方式，例如链接、文件、网页内嵌，你可以将自己创建的地图嵌入自己的网页中。
        </p>
      </div>
    </article>

    <p class="home-about-note">
      项目代码与原创文档遵循仓库许可证；原版 Bobby Carrot 资产的权利边界以 THIRD_PARTY_ASSETS.md 为准。
    </p>
  </section>
</template>

<style scoped>
.home-about {
  width: min(900px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  gap: clamp(64px, 10vw, 120px);
  padding: clamp(90px, 12vw, 150px) 0 96px;
  border-top: 1px solid var(--bc-panel-border);
}

.home-about-heading {
  width: min(720px, 100%);
  display: grid;
  gap: 12px;
}

.home-about-heading h2 {
  margin: 0;
  max-width: 680px;
  font-size: clamp(2rem, 4vw, 3.7rem);
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.home-about-heading p,
.feature-copy p {
  margin: 0;
  color: var(--bc-text-muted);
  line-height: 1.75;
}

.home-about-heading p {
  font-size: clamp(1rem, 1.7vw, 1.22rem);
}

.feature-story {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: clamp(36px, 6vw, 78px);
  align-items: center;
}

.feature-story.reverse .feature-visual {
  order: 2;
}

.feature-story.reverse .feature-copy {
  order: 1;
}

.feature-visual {
  min-width: 0;
}

.feature-story-train .feature-visual {
  border-radius: var(--bc-panel-radius);
  overflow: hidden;
  border: 1px solid var(--bc-panel-border);
  box-shadow: var(--bc-panel-shadow);
}

.feature-copy {
  display: grid;
  gap: 13px;
}

.feature-copy > span {
  color: var(--bc-highlight);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.feature-copy h3 {
  margin: 0;
  font-size: clamp(1.7rem, 3vw, 2.7rem);
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.home-about-note {
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid var(--bc-panel-border);
  color: var(--bc-text-muted);
  font-size: 0.7rem;
  line-height: 1.6;
}

@media (max-width: 820px) {
  .home-about {
    width: min(100% - 28px, 680px);
    gap: 76px;
    padding-top: 90px;
  }

  .feature-story {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .feature-story.reverse .feature-visual,
  .feature-story.reverse .feature-copy {
    order: initial;
  }
}
</style>
