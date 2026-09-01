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
      <h2 id="home-about-title">经典世界，在浏览器中重新出发</h2>
      <p>从原版关卡、美术与机关出发，把兔子波比 5 重新带到现代 Web。</p>
    </header>

    <article class="feature-story feature-story-train">
      <div class="feature-visual">
        <NightTrainScene :images="images" />
      </div>
      <div class="feature-copy">
        <span>01 · CLASSIC REMAKE</span>
        <h3>在浏览器里复刻经典</h3>
        <p>
          原版 Campaign、机关、美术与音乐重新运行在浏览器中，同时保持地图与运行规则可验证、可继续精修。
        </p>
      </div>
    </article>

    <article class="feature-story reverse">
      <div class="feature-visual">
        <PushboxFeaturePreview />
      </div>
      <div class="feature-copy">
        <span>02 · MAP EDITOR</span>
        <h3>创建属于自己的关卡</h3>
        <p>
          内置地图编辑器直接使用同一套 Engine。除了原版元素，还可以组合更丰富的玩法，例如完整的推箱子地图。
        </p>
      </div>
    </article>

    <article class="feature-story">
      <div class="feature-visual">
        <EmbedFeaturePreview />
      </div>
      <div class="feature-copy">
        <span>03 · SHARE &amp; EMBED</span>
        <h3>把地图分享出去</h3>
        <p>
          自制地图可以压缩成链接直接分享，也可以作为可玩的小游戏嵌入自己的网页，让地图真正离开编辑器继续传播。
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
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  gap: clamp(64px, 10vw, 120px);
  padding: clamp(90px, 12vw, 150px) 0 96px;
  border-top: 1px solid rgb(255 255 255 / 18%);
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
  color: #d6e5f8;
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
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 20%);
  box-shadow: 0 22px 60px rgb(0 11 38 / 34%);
}

.feature-copy {
  display: grid;
  gap: 13px;
}

.feature-copy > span {
  color: #7bd7e5;
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
  border-top: 1px solid rgb(255 255 255 / 12%);
  color: #b9cbe3;
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
