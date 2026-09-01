<script setup lang="ts">
import type { EditorMap } from "@bobby/editor";
import type { ImageManager } from "@bobby/engine";
import type { HomeViewState } from "./types.js";
import OriginalFlightScene from "../../shared/original-scenes/OriginalFlightScene.vue";
import OriginalStarfield from "../../shared/original-scenes/OriginalStarfield.vue";
import HomeDemo from "./HomeDemo.vue";
import HomeModeMenu from "./HomeModeMenu.vue";
import ProjectIntro from "./ProjectIntro.vue";

defineProps<{ state: HomeViewState; images: ImageManager }>();
const emit = defineEmits<{
  ready: [canvas: HTMLCanvasElement];
  navigate: [path: string];
  restart: [];
  importMap: [level: EditorMap];
}>();
</script>

<template>
  <div class="home-page">
    <OriginalStarfield
      class="home-page-starfield"
      :images="images"
      :big-star-probability="0.08"
      :small-star-probability="0.16"
      :scroll-speed="42"
      :sparkle-min-delay-ms="650"
      :sparkle-max-delay-ms="1600"
      :sparkle-frame-ms="72"
    />
    <div class="home-page-content">
      <section class="home-hero" aria-label="开始游戏">
        <div class="home-hero-left">
          <div class="home-sky-brand" aria-hidden="true">
            <OriginalFlightScene :images="images" :show-stars="false" />
          </div>
          <div class="home-mode-layer">
            <HomeModeMenu
              @navigate="emit('navigate', $event)"
              @import-map="emit('importMap', $event)"
            >
              <p class="home-import-feedback" aria-live="polite">
                {{ state.importFeedback }}
              </p>
            </HomeModeMenu>
          </div>
        </div>
        <div class="home-demo-column">
          <HomeDemo
            :state="state"
            @ready="emit('ready', $event)"
            @restart="emit('restart')"
            @adventure="emit('navigate', '/adventure')"
          />
        </div>
      </section>
      <ProjectIntro :images="images" />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  min-height: 100%;
  overflow: clip;
  background: var(--bc-bg);
  color: var(--bc-text);
}

.home-page-starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100vw;
  height: 100vh;
}

.home-page-content {
  position: relative;
  z-index: 1;
}

:global(html[data-theme="fc"]) .home-page-starfield {
  display: none;
}

.home-hero {
  --home-hero-left-top: 12px;
  --home-hero-right-top: 20px;
  --home-title-top: 8px;
  --home-title-left: 32%;
  --home-title-width: min(50%, 350px);
  --home-bobby-top: 150px;
  --home-bobby-left: 63%;
  --home-bobby-width: min(22%, 145px);
  --home-mode-top: 310px;

  width: min(1280px, calc(100% - 48px));
  min-height: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 430px);
  gap: clamp(30px, 5vw, 72px);
  align-items: start;
  padding: 0;
}

.home-hero-left {
  position: relative;
  min-width: 0;
  min-height: 100%;
}

.home-sky-brand {
  position: absolute;
  inset: var(--home-hero-left-top) 0 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.home-sky-brand :deep(.original-flight-scene) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.home-sky-brand :deep(.flight-title) {
  top: var(--home-title-top);
  left: var(--home-title-left);
  width: var(--home-title-width);
  max-height: none;
}

.home-sky-brand :deep(.flight-bobby) {
  top: var(--home-bobby-top);
  bottom: auto;
  left: var(--home-bobby-left);
  width: var(--home-bobby-width);
}

.home-mode-layer {
  position: relative;
  z-index: 1;
  width: min(520px, 100%);
  padding-top: calc(var(--home-hero-left-top) + var(--home-mode-top));
}

.home-demo-column {
  min-width: 0;
  display: grid;
  place-items: start center;
  padding-top: var(--home-hero-right-top);
}

.home-import-feedback {
  min-height: 1.3em;
  margin: 8px 2px 0;
  color: var(--bc-text-muted);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .home-hero {
    --home-hero-left-top: 10px;
    --home-hero-right-top: 0px;
    --home-title-left: 42%;
    --home-title-width: min(56%, 340px);
    --home-bobby-top: 145px;
    --home-bobby-left: 67%;
    --home-bobby-width: min(25%, 140px);
    --home-mode-top: 300px;

    width: min(100% - 28px, 720px);
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .home-mode-layer {
    width: min(520px, 100%);
  }
}

@media (max-width: 520px) {
  .home-hero {
    --home-title-left: 45%;
    --home-title-width: min(62%, 300px);
    --home-bobby-top: 132px;
    --home-bobby-left: 70%;
    --home-bobby-width: min(28%, 125px);
    --home-mode-top: 270px;

    width: min(100% - 18px, 720px);
  }
}
</style>
