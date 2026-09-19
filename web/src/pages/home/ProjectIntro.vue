<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import NightTrainScene from "../../shared/original-scenes/NightTrainScene.vue";
import EmbedFeaturePreview from "./EmbedFeaturePreview.vue";
import PushboxFeaturePreview from "./PushboxFeaturePreview.vue";
import { webT } from "../../i18n/webI18n.js";

defineProps<{ images: ImageManager }>();
</script>

<template>
  <section class="home-about" aria-labelledby="home-about-title">
    <header class="home-about-heading">
      <span class="eyebrow">BOBBY CARROT 5 REMAKE</span>
      <h2 id="home-about-title">{{ webT("home.intro.title") }}</h2>
      <p>{{ webT("home.intro.lead") }}</p>
    </header>

    <article class="feature-story feature-story-train">
      <div class="feature-visual">
        <NightTrainScene :images="images" />
      </div>
      <div class="feature-copy">
        <span>CLASSIC REMAKE</span>
        <h3>{{ webT("home.intro.classicTitle") }}</h3>
        <p>{{ webT("home.intro.classicDescription") }}</p>
      </div>
    </article>

    <article class="feature-story reverse">
      <div class="feature-visual">
        <PushboxFeaturePreview />
      </div>
      <div class="feature-copy">
        <span>MAP EDITOR</span>
        <h3>{{ webT("home.intro.editorTitle") }}</h3>
        <p>{{ webT("home.intro.editorDescription") }}</p>
      </div>
    </article>

    <article class="feature-story">
      <div class="feature-visual">
        <EmbedFeaturePreview />
      </div>
      <div class="feature-copy">
        <span>SHARE &amp; EMBED</span>
        <h3>{{ webT("home.intro.shareTitle") }}</h3>
        <p>{{ webT("home.intro.shareDescription") }}</p>
      </div>
    </article>

    <p class="home-about-note">{{ webT("home.intro.legalNote") }}</p>
  </section>
</template>

<style scoped>
.home-about {
  width: min(900px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  gap: clamp(64px, 10vw, 120px);
  padding: clamp(90px, 12vw, 150px) 0 96px;
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
