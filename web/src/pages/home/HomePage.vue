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
    <OriginalStarfield class="home-page-starfield" :images="images" />
    <div class="home-page-content">
      <section class="home-hero" aria-label="开始游戏">
        <div class="home-hero-left">
          <div class="home-sky-brand">
            <OriginalFlightScene :images="images" :show-stars="false" />
          </div>
          <HomeModeMenu
            @navigate="emit('navigate', $event)"
            @import-map="emit('importMap', $event)"
          >
            <p class="home-import-feedback" aria-live="polite">
              {{ state.importFeedback }}
            </p>
          </HomeModeMenu>
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
  color: #f5f8ff;
}

.home-page-starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}

.home-page-content {
  position: relative;
  z-index: 1;
}

:global(html[data-theme="fc"]) .home-page-starfield {
  display: none;
}

.home-hero {
  width: min(1280px, calc(100% - 48px));
  min-height: calc(100dvh - 58px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 430px);
  gap: clamp(30px, 5vw, 72px);
  align-items: center;
  padding: clamp(28px, 5vh, 58px) 0;
}

.home-hero-left {
  min-width: 0;
  display: grid;
  gap: 22px;
}

.home-sky-brand {
  width: 100%;
}

.home-sky-brand :deep(.original-flight-scene) {
  min-height: clamp(300px, 39vh, 390px);
}

.home-demo-column {
  display: grid;
  place-items: center;
  min-width: 0;
}

.home-import-feedback {
  min-height: 1.3em;
  margin: 8px 2px 0;
  color: #d7e7fb;
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .home-hero {
    width: min(100% - 28px, 720px);
    grid-template-columns: 1fr;
    align-content: start;
    gap: 40px;
    padding: 24px 0 54px;
  }

  .home-sky-brand :deep(.original-flight-scene) {
    min-height: 330px;
  }
}

@media (max-width: 520px) {
  .home-hero {
    width: min(100% - 18px, 720px);
  }

  .home-sky-brand :deep(.original-flight-scene) {
    min-height: 285px;
  }
}
</style>
